"""Monitor endpoint - recurring price checks with proactive alerts"""
import logging

from fastapi import APIRouter
from models.schemas import MonitorConfig, MonitorResponse
from database import get_db, check_price_compliance_bulk
from services.scheduler import add_monitor_job
from services.tinyfish import search_all_pharmacies
from services.exa import detect_price_anomaly
from services.discord import send_alert, send_alert_with_audio
from services.elevenlabs import generate_audio
from services.twilio_call import make_voice_call
from services.price_fluctuation import get_prices_id_cutoff_before_scan, fluctuation_lines_for_scan
from config import settings

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


async def _send_vn_alert(message: str, vn_text: str):
    """Send Discord alert with optional Vietnamese voice note + Twilio phone call."""
    audio = None
    if settings.elevenlabs_api_key:
        audio = await generate_audio(vn_text, settings.elevenlabs_api_key)

    # Discord
    if settings.discord_webhook_url:
        if audio:
            await send_alert_with_audio(message, audio, settings.discord_webhook_url)
        else:
            await send_alert(message, settings.discord_webhook_url)

    # Twilio phone call — only for alerts with audio
    if audio and settings.twilio_account_sid:
        public_url = settings.cors_origins.split(",")[0].replace("3005", "8000") if settings.cors_origins else None
        await make_voice_call(
            audio_bytes=audio,
            account_sid=settings.twilio_account_sid,
            auth_token=settings.twilio_auth_token,
            from_number=settings.twilio_from_number,
            to_number=settings.twilio_to_number,
            public_api_url=public_url,
        )


async def run_monitor_job(monitor_id: int, drug_query: str):
    """Execute a monitoring job - search, detect changes, fire proactive alerts."""
    try:
        await _run_monitor_job(monitor_id, drug_query)
    except Exception as e:
        logger.error(f"Monitor job {monitor_id} failed: {e}")


async def _run_monitor_job(monitor_id: int, drug_query: str):
    """Internal monitor job with 3 proactive behaviors."""
    # Snapshot price ID cutoff before this scan's inserts
    prior_max_id = await get_prices_id_cutoff_before_scan()

    results = await search_all_pharmacies(drug_query, settings.tinyfish_api_key)

    db = await get_db()
    try:
        # Store results
        for source_id, result in results.items():
            if result.status == "success":
                for product in result.products:
                    await db.execute(
                        """INSERT INTO prices (drug_query, source_id, product_name, price, original_price,
                           pack_size, unit_price, manufacturer, in_stock, product_url)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                        (drug_query, source_id, product.product_name, product.price,
                         product.original_price, product.pack_size, product.unit_price,
                         product.manufacturer, product.in_stock, product.product_url),
                    )

        # Update last_run_at
        await db.execute(
            "UPDATE monitor_jobs SET last_run_at = CURRENT_TIMESTAMP WHERE id = ?",
            (monitor_id,),
        )
        await db.commit()

        # Collect all products for analysis
        all_products = []
        for r in results.values():
            if r.status == "success":
                all_products.extend(r.products)

        if not all_products:
            return  # Nothing to analyze

        # ── Behavior 1: Price Drop Alert (>10% drop) ──────────────────────
        fluctuations = await fluctuation_lines_for_scan(drug_query, results, prior_max_id)
        for source_id, result in results.items():
            if result.status != "success" or not result.products:
                continue
            cur_min = min(p.price for p in result.products)
            # Check against prior price for this source
            cursor = await db.execute(
                """SELECT price FROM prices
                   WHERE drug_query = ? AND source_id = ? AND id <= ?
                   ORDER BY observed_at DESC LIMIT 1""",
                (drug_query, source_id, prior_max_id),
            )
            row = await cursor.fetchone()
            if row:
                prev_price = int(row[0])
                if prev_price > 0:
                    drop_pct = ((prev_price - cur_min) / prev_price) * 100
                    if drop_pct >= 10:
                        msg = (
                            f"📉 **Price Drop Alert!**\n"
                            f"**{drug_query}** dropped **{drop_pct:.0f}%** at **{result.source_name}**\n"
                            f"Was: {prev_price:,} VND → Now: {cur_min:,} VND"
                        )
                        vn = (
                            f"{drug_query} giá giảm {drop_pct:.0f}% tại {result.source_name}, "
                            f"từ {prev_price:,} xuống {cur_min:,} đồng."
                        )
                        await _send_vn_alert(msg, vn)
                        logger.info(f"Price drop alert: {drug_query} -{drop_pct:.0f}% at {result.source_name}")

        # ── Behavior 2: Anomaly Watchdog (>2 SD below mean) ───────────────
        anomalies = detect_price_anomaly(all_products, threshold=0.5)
        for anomaly in anomalies:
            pct_below = abs(anomaly.get("deviation_pct", 0))
            msg = (
                f"⚠️ **Anomaly Detected!**\n"
                f"**{anomaly['product_name']}** priced at **{anomaly['unit_price']:,.0f} VND** — "
                f"**{pct_below:.0f}%** below median ({anomaly['median_price']:,.0f} VND)\n"
                f"Possible counterfeit or near-expiry product."
            )
            vn = (
                f"Cảnh báo: {anomaly['product_name']} giá bất thường, "
                f"{anomaly['unit_price']:,.0f} đồng, thấp hơn {pct_below:.0f}% so với giá trung bình."
            )
            await _send_vn_alert(msg, vn)
            logger.info(f"Anomaly alert: {anomaly['product_name']} at {anomaly['unit_price']} VND")

        # ── Behavior 3: Compliance Violation Auto-Report ──────────────────
        # Tag products with source_name before compliance check
        tagged_products = []
        for source_id, result in results.items():
            if result.status == "success":
                for p in result.products:
                    p.source_name = result.source_name  # type: ignore[attr-defined]
                    tagged_products.append(p)
        compliance = await check_price_compliance_bulk(drug_query, tagged_products)
        if compliance.get("has_ceiling") and compliance.get("violation_count", 0) > 0:
            ceiling = compliance["ceiling_price"]
            for v in compliance.get("violations", []):
                prod = v.get("product", drug_query)
                src = v.get("source", "Unknown")
                up = v.get("unit_price", 0)
                dp = v.get("delta_percent", 0)
                msg = (
                    f"🚨 **Compliance Violation!**\n"
                    f"**{src}** selling **{prod}** at "
                    f"**{up:,.0f} VND/unit** — exceeds DAV ceiling of "
                    f"**{ceiling:,} VND** by **{dp:.0f}%**"
                )
                vn = (
                    f"Vi phạm: {src} bán {drug_query} giá {up:,.0f} đồng, "
                    f"vượt giá trần {ceiling:,} đồng."
                )
                await _send_vn_alert(msg, vn)
                logger.info(f"Compliance violation: {prod} at {src}")

        # ── Original alert threshold check ────────────────────────────────
        alerts = await db.execute_fetchall(
            "SELECT * FROM alerts WHERE drug_query = ? AND is_active = 1",
            (drug_query,),
        )
        for alert in alerts:
            all_prices = [p.price for p in all_products]
            if all_prices and min(all_prices) <= alert["price_threshold"]:
                best = min(all_prices)
                msg = (
                    f"🔔 **Price Alert!**\n"
                    f"{drug_query} dropped to {best:,} VND\n"
                    f"Threshold: {alert['price_threshold']:,} VND"
                )
                vn = (
                    f"Giá {drug_query} vừa giảm xuống {best:,} đồng, "
                    f"thấp hơn ngưỡng cảnh báo {alert['price_threshold']:,} đồng."
                )
                await _send_vn_alert(msg, vn)
    finally:
        await db.close()


@router.post("/monitor", response_model=MonitorResponse)
async def create_monitor(config: MonitorConfig):
    """Create a recurring price monitor."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO monitor_jobs (drug_query, interval_minutes, sources) VALUES (?, ?, ?)",
            (config.drug_query, config.interval_minutes, config.sources),
        )
        await db.commit()
        job_id = cursor.lastrowid

        add_monitor_job(
            f"monitor_{job_id}",
            run_monitor_job,
            config.interval_minutes,
            monitor_id=job_id,
            drug_query=config.drug_query,
        )

        return MonitorResponse(
            id=job_id,
            drug_query=config.drug_query,
            interval_minutes=config.interval_minutes,
            is_active=True,
        )
    finally:
        await db.close()


@router.get("/monitors")
async def list_monitors():
    """List all active monitors."""
    db = await get_db()
    try:
        rows = await db.execute_fetchall("SELECT * FROM monitor_jobs WHERE is_active = 1")
        return [dict(r) for r in rows]
    finally:
        await db.close()
