"""Monitor endpoint - recurring price checks"""
from fastapi import APIRouter
from models.schemas import MonitorConfig, MonitorResponse
from database import get_db
from services.scheduler import add_monitor_job
from services.tinyfish import search_all_pharmacies
from config import settings

router = APIRouter(prefix="/api")


async def run_monitor_job(monitor_id: int, drug_query: str):
    """Execute a monitoring job - search and check alerts."""
    import logging
    _logger = logging.getLogger(__name__)
    try:
        await _run_monitor_job(monitor_id, drug_query)
    except Exception as e:
        _logger.error(f"Monitor job {monitor_id} failed: {e}")


async def _run_monitor_job(monitor_id: int, drug_query: str):
    """Internal monitor job execution."""
    from database import get_db as _get_db
    results = await search_all_pharmacies(drug_query, settings.tinyfish_api_key)

    db = await _get_db()
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

        # Check alerts
        alerts = await db.execute_fetchall(
            "SELECT * FROM alerts WHERE drug_query = ? AND is_active = 1",
            (drug_query,),
        )
        for alert in alerts:
            all_prices = []
            for r in results.values():
                if r.status == "success":
                    all_prices.extend(p.price for p in r.products)
            if all_prices and min(all_prices) <= alert["price_threshold"]:
                from services.discord import send_alert, send_alert_with_audio
                from services.elevenlabs import generate_audio
                from config import settings as _settings

                best = min(all_prices)
                msg = f"🔔 **Price Alert!**\n{drug_query} dropped to {best:,} VND\nThreshold: {alert['price_threshold']:,} VND"

                # Try to send with Vietnamese voice summary
                vn_text = f"Giá {drug_query} vừa giảm xuống {best:,} đồng, thấp hơn ngưỡng cảnh báo {alert['price_threshold']:,} đồng."
                audio = await generate_audio(vn_text, _settings.elevenlabs_api_key)

                if audio:
                    await send_alert_with_audio(msg, audio, _settings.discord_webhook_url)
                else:
                    await send_alert(msg, _settings.discord_webhook_url)
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
