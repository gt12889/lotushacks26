"""Compare current scan prices to the prior SQLite observation per drug query + chain (source)."""
from __future__ import annotations

import logging

from database import get_db
from models.schemas import PharmacySearchResult

logger = logging.getLogger(__name__)

_MAX_PRODUCT_LEN = 48


async def get_prices_id_cutoff_before_scan() -> int:
    """Largest ``prices.id`` before this scan; new inserts will be strictly greater."""
    db = await get_db()
    try:
        cur = await db.execute("SELECT COALESCE(MAX(id), 0) FROM prices")
        row = await cur.fetchone()
        return int(row[0])
    finally:
        await db.close()


def _short(name: str) -> str:
    name = (name or "").strip()
    if len(name) <= _MAX_PRODUCT_LEN:
        return name
    return name[: _MAX_PRODUCT_LEN - 1] + "…"


async def fluctuation_lines_for_scan(
    drug_query: str,
    results: dict[str, PharmacySearchResult],
    prior_max_price_id: int,
    *,
    max_lines: int = 8,
) -> list[str]:
    """
    For each successful source, compare this scan's cheapest SKU to the most recent
    prior row in ``prices`` for the same ``drug_query`` and ``source_id``.

    ``prior_max_price_id`` must be ``SELECT COALESCE(MAX(id),0) FROM prices`` taken
    **before** this scan inserts rows, so current-run rows are excluded.
    """
    lines: list[str] = []
    db = await get_db()
    try:
        for sid, r in results.items():
            if r.status != "success" or not r.products:
                continue
            cur_min = min(p.price for p in r.products)
            cur_product = next(p.product_name for p in r.products if p.price == cur_min)
            cursor = await db.execute(
                """
                SELECT price, product_name, observed_at FROM prices
                WHERE drug_query = ? AND source_id = ? AND id <= ?
                ORDER BY observed_at DESC, id DESC
                LIMIT 1
                """,
                (drug_query, sid, prior_max_price_id),
            )
            row = await cursor.fetchone()
            if row is None:
                continue
            prev_price = int(row[0])
            delta = cur_min - prev_price
            loc = r.source_name
            prod = _short(cur_product)
            if delta == 0:
                lines.append(f'{loc} ({prod}): still {cur_min:,} VND vs last scan ({prev_price:,} VND).')
            elif delta < 0:
                lines.append(
                    f'{loc} ({prod}): {cur_min:,} VND, down {abs(delta):,} from last scan ({prev_price:,} VND).'
                )
            else:
                lines.append(
                    f'{loc} ({prod}): {cur_min:,} VND, up {delta:,} from last scan ({prev_price:,} VND).'
                )
            if len(lines) >= max_lines:
                break
    except Exception as e:
        logger.warning("price fluctuation query failed: %s", e)
    finally:
        await db.close()
    return lines
