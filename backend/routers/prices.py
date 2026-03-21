"""Prices endpoint - cached results"""
from fastapi import APIRouter, Query
from database import get_db

router = APIRouter(prefix="/api")


@router.get("/prices/{drug_query}")
async def get_prices(
    drug_query: str,
    sources: str = Query("all", description="Comma-separated source IDs"),
    limit: int = Query(50, le=200),
):
    """Get cached price data for a drug query."""
    db = await get_db()
    try:
        if sources == "all":
            rows = await db.execute_fetchall(
                """SELECT p.*, s.name as source_name FROM prices p
                   JOIN sources s ON p.source_id = s.id
                   WHERE p.drug_query = ? ORDER BY p.price ASC LIMIT ?""",
                (drug_query, limit),
            )
        else:
            source_list = sources.split(",")
            placeholders = ",".join("?" * len(source_list))
            rows = await db.execute_fetchall(
                f"""SELECT p.*, s.name as source_name FROM prices p
                    JOIN sources s ON p.source_id = s.id
                    WHERE p.drug_query = ? AND p.source_id IN ({placeholders})
                    ORDER BY p.price ASC LIMIT ?""",
                (drug_query, *source_list, limit),
            )
        return {"query": drug_query, "results": [dict(r) for r in rows]}
    finally:
        await db.close()


@router.get("/trends/{drug_query}")
async def get_trends(
    drug_query: str,
    days: int = Query(7, le=90),
    source: str = Query(None),
):
    """Get historical price trend data."""
    db = await get_db()
    try:
        if source:
            rows = await db.execute_fetchall(
                """SELECT p.*, s.name as source_name FROM prices p
                   JOIN sources s ON p.source_id = s.id
                   WHERE p.drug_query = ? AND p.source_id = ?
                   AND p.observed_at >= datetime('now', ?)
                   ORDER BY p.observed_at ASC""",
                (drug_query, source, f"-{days} days"),
            )
        else:
            rows = await db.execute_fetchall(
                """SELECT p.*, s.name as source_name FROM prices p
                   JOIN sources s ON p.source_id = s.id
                   WHERE p.drug_query = ?
                   AND p.observed_at >= datetime('now', ?)
                   ORDER BY p.observed_at ASC""",
                (drug_query, f"-{days} days"),
            )
        return {"query": drug_query, "days": days, "data": [dict(r) for r in rows]}
    finally:
        await db.close()


@router.get("/sparklines/{drug_query}")
async def get_sparklines(drug_query: str, days: int = Query(7, ge=1, le=90)):
    """Return per-source price history for sparkline rendering."""
    db = await get_db()
    try:
        rows = await db.execute_fetchall(
            """SELECT p.source_id, s.name as source_name, p.price, p.observed_at
               FROM prices p
               JOIN sources s ON p.source_id = s.id
               WHERE p.drug_query = ?
               AND p.observed_at >= datetime('now', ?)
               ORDER BY p.source_id, p.observed_at""",
            (drug_query, f'-{days} days'),
        )
        sparklines: dict = {}
        for row in rows:
            sid = row[0]
            if sid not in sparklines:
                sparklines[sid] = {"source_name": row[1], "points": []}
            sparklines[sid]["points"].append({"price": row[2], "time": row[3]})
        return {"drug_query": drug_query, "sparklines": sparklines}
    finally:
        await db.close()
