"""Search endpoint - primary demo endpoint with SSE streaming"""
import asyncio
import json
import logging
import time
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from models.schemas import PharmacySearchResult
from services.tinyfish import search_single_pharmacy_safe, PHARMACY_CONFIGS
from services.variants import discover_variants_with_exa
from services.exa import search_who_reference_price, search_drug_info
from services.qwen import normalize_vietnamese_drug_text
from services.agent_manager import AgentManager, AgentTier
from services import supermemory_mem
from services.price_fluctuation import fluctuation_lines_for_scan, get_prices_id_cutoff_before_scan
from config import settings
from database import get_db, check_price_compliance_bulk

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


def _log_supermemory_remember_done(task: asyncio.Task) -> None:
    if task.cancelled():
        return
    exc = task.exception()
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
    qwen_latency: int | None = None
    if settings.openrouter_api_key:
        _qwen_start = time.time()
        normalized = await normalize_vietnamese_drug_text(query, settings.openrouter_api_key)
        qwen_latency = int((time.time() - _qwen_start) * 1000)
        if normalized and normalized != query:
            # Strip markdown code fences if present
            clean = normalized.strip()
            if clean.startswith("```"):
                lines = clean.split("\n")
                lines = [l for l in lines[1:] if not l.strip().startswith("```")]
                clean = "\n".join(lines).strip()
            try:
                import json as _json
                parsed = _json.loads(clean)
                if isinstance(parsed, dict) and parsed.get("drug"):
                    query = parsed["drug"]
                    logger.info(f"Qwen normalized query to: {query}")
            except (ValueError, TypeError, _json.JSONDecodeError):
                pass  # Keep original query if parsing fails
    target_sources = list(PHARMACY_CONFIGS.keys()) if sources == "all" else sources.split(",")

    async def event_generator():
        prior_price_id_cutoff = await get_prices_id_cutoff_before_scan()

        # Emit Qwen normalization model_used event (measured in outer scope)
        if qwen_latency is not None:
            yield f"data: {json.dumps({'type': 'model_used', 'step': 'normalize', 'model': 'qwen/qwen-2.5-72b-instruct', 'provider': 'OpenRouter', 'latency_ms': qwen_latency})}\n\n"

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

                # Emit model_used for Tier 1 search
                yield f"data: {json.dumps({'type': 'model_used', 'step': 'search', 'model': 'TinyFish Agent', 'provider': 'TinyFish', 'latency_ms': result.response_time_ms})}\n\n"

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
                            _variant_start = time.time()
                            variants = await discover_variants_with_exa(
                                query, products, settings.exa_api_key
                            )
                            variant_latency = int((time.time() - _variant_start) * 1000)
                            mgr.complete(agent_id, len(variants))
                            return variants, variant_latency
                        except Exception as e:
                            mgr.fail(agent_id, str(e))
                            return [], 0

                    variant_tasks.append(asyncio.create_task(
                        _discover_variants(result.products, t2_aid)
                    ))

        # Collect variant results
        all_variants = []
        if variant_tasks:
            variant_results = await asyncio.gather(*variant_tasks, return_exceptions=True)
            for vr in variant_results:
                if isinstance(vr, tuple) and len(vr) == 2:
                    variants_list, variant_latency = vr
                    all_variants.extend(variants_list)
                    yield f"data: {json.dumps({'type': 'model_used', 'step': 'discovery', 'model': 'Neural Search', 'provider': 'Exa', 'latency_ms': variant_latency})}\n\n"
                elif isinstance(vr, list):
                    all_variants.extend(vr)
            all_variants = list(set(all_variants))[:8]

        # Emit remaining agent events (post-Tier 2)
        for event in mgr.drain_events():
            yield f"data: {json.dumps(event)}\n\n"

        # Tier 3: Auto-spawn searches for discovered variants (scout-spawn pattern)
        tier3_products = []
        if all_variants:
            successful_sources = [sid for sid, r in results.items() if r.status == "success"]

            tier3_tasks = {}
            for variant in all_variants[:3]:
                for sid in successful_sources:
                    t3_aid = mgr.spawn(AgentTier.VARIANT, f"T3: {variant} @ {PHARMACY_CONFIGS[sid]['name']}", variant, parent_id=None)
                    for event in mgr.drain_events():
                        yield f"data: {json.dumps(event)}\n\n"

                    task = asyncio.create_task(
                        search_single_pharmacy_safe(sid, variant, settings.tinyfish_api_key)
                    )
                    tier3_tasks[(variant, sid)] = (task, t3_aid)

            if tier3_tasks:
                pending_t3 = {t for (t, _) in tier3_tasks.values()}
                while pending_t3:
                    done_t3, pending_t3 = await asyncio.wait(pending_t3, return_when=asyncio.FIRST_COMPLETED)
                    for completed in done_t3:
                        t3_result = completed.result()
                        for (variant, sid), (task, aid) in tier3_tasks.items():
                            if task is completed:
                                if t3_result.status == "success":
                                    mgr.complete(aid, t3_result.result_count)
                                    for p in t3_result.products:
                                        tier3_products.append(p)
                                    asyncio.create_task(_store_results(variant, sid, t3_result.products))
                                else:
                                    mgr.fail(aid, t3_result.error or "Failed")

                                for event in mgr.drain_events():
                                    yield f"data: {json.dumps(event)}\n\n"

                                result_data = t3_result.model_dump()
                                result_data["is_variant_result"] = True
                                result_data["variant_of"] = variant
                                yield f"data: {json.dumps(result_data)}\n\n"

                                yield f"data: {json.dumps({'type': 'model_used', 'step': 'variant_search', 'model': 'TinyFish Agent', 'provider': 'TinyFish', 'latency_ms': t3_result.response_time_ms})}\n\n"
                                break

        # Exa enrichment: WHO reference pricing + drug info (parallel, non-blocking)
        who_ref = None
        drug_info = None
        if settings.exa_api_key:
            who_task = asyncio.create_task(search_who_reference_price(query, settings.exa_api_key))
            info_task = asyncio.create_task(search_drug_info(query, settings.exa_api_key))
            try:
                who_ref = await who_task
            except Exception as e:
                logger.warning(f"WHO reference search failed: {e}")
            try:
                drug_info = await info_task
            except Exception as e:
                logger.warning(f"Drug info search failed: {e}")

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
        best_source_id = None
        if best_price:
            for r in results.values():
                if any(p.price == best_price for p in r.products):
                    best_source = r.source_name
                    best_source_id = r.source_id
                    break

        price_fluctuations = await fluctuation_lines_for_scan(
            query, results, prior_price_id_cutoff, max_lines=8
        )

        summary = {
            "type": "search_complete",
            "task": "summary",  # backward compat
            "query": query,
            "best_price": best_price,
            "best_source": best_source,
            "price_range": f"{best_price:,} - {worst_price:,} VND" if best_price and worst_price else None,
            "potential_savings": worst_price - best_price if best_price and worst_price else 0,
            "total_results": sum(r.result_count for r in results.values()) + len(tier3_products),
            "variant_products_count": len(tier3_products),
            "unique_products": len(deduplicated),
            "deduplicated": deduplicated[:20],
            "variants": all_variants,
            "price_fluctuations": price_fluctuations,
            "agents": mgr.stats,
            "agent_tree": mgr.tree,
        }

        # Check government ceiling compliance
        compliance_data = {"has_ceiling": False, "drug_query": query}
        try:
            compliance_results = await check_price_compliance_bulk(query, all_products)
            if compliance_results:
                compliance_data = compliance_results
        except Exception as e:
            logger.warning(f"Compliance check failed: {e}")

        summary["compliance"] = compliance_data
        if who_ref:
            summary["who_reference"] = who_ref
        if drug_info:
            summary["drug_info"] = drug_info

        mem_tag = supermemory_mem.normalize_user_tag(memory_user) if memory_user else None
        if mem_tag and supermemory_mem.is_enabled():
            _mem_task = asyncio.create_task(
                supermemory_mem.remember_search_session(
                    mem_tag,
                    query,
                    best_price=best_price,
                    best_source=best_source,
                    best_source_id=best_source_id,
                    potential_savings=summary["potential_savings"] or None,
                    fluctuation_lines=price_fluctuations or None,
                )
            )
            _mem_task.add_done_callback(_log_supermemory_remember_done)

        yield f"data: {json.dumps(summary, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
