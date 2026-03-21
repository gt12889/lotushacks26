"""Search endpoint - primary demo endpoint with SSE streaming"""
import asyncio
import json
import logging
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from models.schemas import PharmacySearchResult
from services.tinyfish import search_single_pharmacy_safe, PHARMACY_CONFIGS
from services.variants import discover_variants_with_exa
from services.qwen import normalize_vietnamese_drug_text
from services.agent_manager import AgentManager, AgentTier
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


async def _store_results(query: str, source_id: str, products: list):
    """Store search results in database with proper cleanup."""
    try:
        db = await get_db()
        try:
            for product in products:
                await db.execute(
                    """INSERT INTO prices (drug_query, source_id, product_name, price, original_price,
                       pack_size, unit_price, manufacturer, in_stock, product_url)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (query, source_id, product.product_name, product.price,
                     product.original_price, product.pack_size, product.unit_price,
                     product.manufacturer, product.in_stock, product.product_url),
                )
            await db.commit()
        finally:
            await db.close()
    except Exception as e:
        logger.error(f"DB store error: {e}")


@router.post("/search")
async def search_drugs(
    query: str = Query(..., description="Drug name to search"),
    sources: str = Query("all", description="Comma-separated source IDs or 'all'"),
    memory_user: str | None = Query(
        None,
        description="Opaque client id; when set and Supermemory is configured, search summary is stored for recall",
    ),
):
    """SSE streaming search with agent orchestration."""
    # Normalize Vietnamese drug query via Qwen (OpenRouter) for better matching
    if settings.openrouter_api_key:
        normalized = await normalize_vietnamese_drug_text(query, settings.openrouter_api_key)
        # Qwen returns JSON; extract the drug name if possible
        if normalized != query:
            try:
                import json as _json
                parsed = _json.loads(normalized)
                if isinstance(parsed, dict) and parsed.get("drug"):
                    query = parsed["drug"]
                    logger.info(f"Qwen normalized query to: {query}")
            except (ValueError, TypeError):
                # If Qwen returned plain text, use it directly
                if len(normalized) < 100:
                    query = normalized
    target_sources = list(PHARMACY_CONFIGS.keys()) if sources == "all" else sources.split(",")

    async def event_generator():
        mgr = AgentManager()
        results = {}
        all_products = []

        # Spawn Tier 1 search agents
        agent_ids = {}
        tasks = {}
        for sid in target_sources:
            aid = mgr.spawn(AgentTier.SEARCH, f"Search {PHARMACY_CONFIGS[sid]['name']}", sid)
            agent_ids[sid] = aid
            tasks[sid] = asyncio.create_task(
                search_single_pharmacy_safe(sid, query, settings.tinyfish_api_key)
            )

        # Emit initial spawn events
        for event in mgr.drain_events():
            yield f"data: {json.dumps(event)}\n\n"

        # Also emit searching status for backward compat
        for sid in target_sources:
            status_event = {
                "type": "pharmacy_status",
                "source_id": sid,
                "source_name": PHARMACY_CONFIGS[sid]["name"],
                "status": "searching",
            }
            yield f"data: {json.dumps(status_event)}\n\n"

        # Process Tier 1 results as they complete (streaming, not batch)
        variant_tasks = []
        pending = set(tasks.values())
        while pending:
            done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
            for completed_task in done:
                result = completed_task.result()
                results[result.source_id] = result
                aid = agent_ids.get(result.source_id, "")

                if result.status == "success":
                    mgr.complete(aid, result.result_count)
                    all_products.extend(result.products)
                    # Store in DB (fire and forget)
                    asyncio.create_task(_store_results(query, result.source_id, result.products))
                else:
                    mgr.fail(aid, result.error or "Unknown error")

                # Emit agent events
                for event in mgr.drain_events():
                    yield f"data: {json.dumps(event)}\n\n"

                # Emit pharmacy result (backward compat)
                yield f"data: {json.dumps(result.model_dump())}\n\n"

                # P2: STREAMING COMPLETION - immediately spawn Tier 2 variant discovery
                # for this pharmacy's results while other Tier 1 agents are still running
                if result.status == "success" and result.products:
                    t2_aid = mgr.spawn(
                        AgentTier.VARIANT,
                        f"Variants from {result.source_name}",
                        query,
                        parent_id=aid,
                    )
                    for event in mgr.drain_events():
                        yield f"data: {json.dumps(event)}\n\n"

                    async def _discover_variants(products, agent_id):
                        try:
                            variants = await discover_variants_with_exa(
                                query, products, settings.exa_api_key
                            )
                            mgr.complete(agent_id, len(variants))
                            return variants
                        except Exception as e:
                            mgr.fail(agent_id, str(e))
                            return []

                    variant_tasks.append(asyncio.create_task(
                        _discover_variants(result.products, t2_aid)
                    ))

        # Collect variant results
        all_variants = []
        if variant_tasks:
            variant_results = await asyncio.gather(*variant_tasks, return_exceptions=True)
            for vr in variant_results:
                if isinstance(vr, list):
                    all_variants.extend(vr)
            all_variants = list(set(all_variants))[:8]

        # Emit remaining agent events
        for event in mgr.drain_events():
            yield f"data: {json.dumps(event)}\n\n"

        # Deduplicate products across sources by normalized name
        seen_products: dict[str, dict] = {}  # normalized_name -> best offer
        for r in results.values():
            if r.status != "success":
                continue
            for p in r.products:
                key = p.product_name.lower().strip()
                entry = {"name": p.product_name, "price": p.price, "source": r.source_name, "source_id": r.source_id}
                if key not in seen_products or p.price < seen_products[key]["price"]:
                    seen_products[key] = entry
        deduplicated = sorted(seen_products.values(), key=lambda x: x["price"])

        # Build summary
        all_prices = [p.price for r in results.values() if r.status == "success" for p in r.products]
        best_price = min(all_prices) if all_prices else None
        worst_price = max(all_prices) if all_prices else None
        best_source = None
        if best_price:
            for r in results.values():
                if any(p.price == best_price for p in r.products):
                    best_source = r.source_name
                    break

        summary = {
            "type": "search_complete",
            "task": "summary",  # backward compat
            "query": query,
            "best_price": best_price,
            "best_source": best_source,
            "price_range": f"{best_price:,} - {worst_price:,} VND" if best_price and worst_price else None,
            "potential_savings": worst_price - best_price if best_price and worst_price else 0,
            "total_results": sum(r.result_count for r in results.values()),
            "unique_products": len(deduplicated),
            "deduplicated": deduplicated[:20],
            "variants": all_variants,
            "agents": mgr.stats,
            "agent_tree": mgr.tree,
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

        yield f"data: {json.dumps(summary, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
