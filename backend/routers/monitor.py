"""Monitor endpoint - recurring price checks"""
from fastapi import APIRouter
from models.schemas import MonitorConfig, MonitorResponse
from database import get_db
from services.scheduler import add_monitor_job
from services.tinyfish import search_all_pharmacies
from config import settings

router = APIRouter(prefix="/api")


async def run_monitor_job(job_id: int, drug_query: str):
    """Execute a monitoring job - search and check alerts."""
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
            (job_id,),
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
                from services.telegram import send_alert
                msg = f"🔔 <b>Price Alert!</b>\n{drug_query} dropped to {min(all_prices):,} VND\nThreshold: {alert['price_threshold']:,} VND"
                await send_alert(msg, settings.telegram_bot_token, alert["telegram_chat_id"] or settings.telegram_chat_id)
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
            job_id=job_id,
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
