"""Alerts endpoint"""
from fastapi import APIRouter
from models.schemas import AlertConfig, AlertResponse
from database import get_db

router = APIRouter(prefix="/api")


@router.post("/alerts", response_model=AlertResponse)
async def create_alert(config: AlertConfig):
    """Create a price alert."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO alerts (drug_query, price_threshold) VALUES (?, ?)",
            (config.drug_query, config.price_threshold),
        )
        await db.commit()
        return AlertResponse(
            id=cursor.lastrowid,
            drug_query=config.drug_query,
            price_threshold=config.price_threshold,
            is_active=True,
        )
    finally:
        await db.close()


@router.get("/alerts")
async def list_alerts():
    """List all active alerts."""
    db = await get_db()
    try:
        rows = await db.execute_fetchall("SELECT * FROM alerts WHERE is_active = 1")
        return [dict(r) for r in rows]
    finally:
        await db.close()


@router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: int):
    """Deactivate an alert."""
    db = await get_db()
    try:
        await db.execute("UPDATE alerts SET is_active = 0 WHERE id = ?", (alert_id,))
        await db.commit()
        return {"status": "deleted"}
    finally:
        await db.close()
