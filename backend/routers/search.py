"""Search endpoint - primary demo endpoint with SSE streaming"""
import asyncio
import json
import logging
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from models.schemas import PharmacySearchResult, SearchResponse
from services.tinyfish import search_single_pharmacy, PHARMACY_CONFIGS
from services.variants import discover_variants_with_exa
from services import supermemory_mem
from config import settings
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


def _log_supermemory_remember_done(task: asyncio.Task) -> None:
    try:
        exc = task.exception()
    except asyncio.CancelledError:
        return
    if exc is not None:
        logger.error("Supermemory remember_search_session failed", exc_info=exc)


@router.post("/search")
async def search_drugs(
    query: str = Query(..., description="Drug name to search"),
    sources: str = Query("all", description="Comma-separated source IDs or 'all'"),
    memory_user: str | None = Query(
        None,
        description="Opaque client id; when set and Supermemory is configured, search summary is stored for recall",
    ),
):
    """SSE streaming search across all pharmacy sources."""
    target_sources = list(PHARMACY_CONFIGS.keys()) if sources == "all" else sources.split(",")

    async def event_generator():
        tasks = {}
        results = {}

        # Start all pharmacy searches
        for sid in target_sources:
            task = asyncio.create_task(
                search_single_pharmacy(sid, query, settings.tinyfish_api_key)
            )
            tasks[sid] = task

            # Emit "searching" status
            event = PharmacySearchResult(
                source_id=sid,
                source_name=PHARMACY_CONFIGS[sid]["name"],
                status="searching",
            )
            yield f"data: {json.dumps(event.model_dump())}\n\n"

        # Collect results as they complete
        pending = set(tasks.values())
        while pending:
            done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            for completed_task in done:
                result = completed_task.result()
                results[result.source_id] = result
                yield f"data: {json.dumps(result.model_dump())}\n\n"

                # Store in database
                try:
                    db = await get_db()
                    try:
                        for product in result.products:
                            await db.execute(
                                """INSERT INTO prices (drug_query, source_id, product_name, price, original_price,
                                   pack_size, unit_price, manufacturer, in_stock, product_url)
                                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                                (query, result.source_id, product.product_name, product.price,
                                 product.original_price, product.pack_size, product.unit_price,
                                 product.manufacturer, product.in_stock, product.product_url),
                            )
                        await db.commit()
                    finally:
                        await db.close()
                except Exception as e:
                    logger.error(f"DB store error: {e}")

        # Emit final summary
        all_prices = []
        for r in results.values():
            if r.status == "success":
                all_prices.extend(p.price for p in r.products)

        best_price = min(all_prices) if all_prices else None
        worst_price = max(all_prices) if all_prices else None
        best_source = None
        if best_price:
            for r in results.values():
                if any(p.price == best_price for p in r.products):
                    best_source = r.source_name
                    break

        # Collect all products for variant discovery
        all_products = []
        for r in results.values():
            if r.status == "success":
                all_products.extend(r.products)

        all_variants = await discover_variants_with_exa(query, all_products, settings.exa_api_key)

        summary = {
            "task": "summary",
            "query": query,
            "best_price": best_price,
            "best_source": best_source,
            "price_range": f"{best_price:,} - {worst_price:,} VND" if best_price and worst_price else None,
            "potential_savings": worst_price - best_price if best_price and worst_price else 0,
            "total_results": sum(r.result_count for r in results.values()),
            "variants": all_variants,
        }

        mem_tag = supermemory_mem.normalize_user_tag(memory_user) if memory_user else None
        if mem_tag and supermemory_mem.is_enabled():
            _mem_task = asyncio.create_task(
                supermemory_mem.remember_search_session(
                    mem_tag,
                    query,
                    best_price=best_price,
                    best_source=best_source,
                    potential_savings=summary["potential_savings"] or None,
                )
            )
            _mem_task.add_done_callback(_log_supermemory_remember_done)

        yield f"data: {json.dumps(summary)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
