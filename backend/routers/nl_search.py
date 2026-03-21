# backend/routers/nl_search.py
"""Natural language search — parses NL query, dispatches parallel drug searches, synthesizes results."""
import asyncio
import json
import logging
import time
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from services.nl_parser import parse_nl_query
from services.tinyfish import search_all_pharmacies
from services.qwen import _call_openrouter
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.post("/nl-search")
async def nl_search(
    query: str = Query(..., description="Natural language drug request"),
):
    """Parse NL query into drugs, search all in parallel, return SSE stream with synthesis."""

    async def event_generator():
        # Step 1: Parse NL query
        parse_start = time.time()
        parsed = await parse_nl_query(query, settings.openrouter_api_key)
        parse_ms = int((time.time() - parse_start) * 1000)

        yield f"data: {json.dumps({'type': 'nl_parsed', 'drugs': parsed['drugs'], 'preferences': parsed.get('preferences', {}), 'summary': parsed.get('summary', ''), 'latency_ms': parse_ms})}\n\n"
        yield f"data: {json.dumps({'type': 'model_used', 'step': 'nl_parse', 'model': 'qwen/qwen-2.5-72b-instruct', 'provider': 'OpenRouter', 'latency_ms': parse_ms})}\n\n"

        drugs = parsed.get("drugs", [])
        if not drugs:
            yield f"data: {json.dumps({'type': 'nl_complete', 'error': 'Could not extract drug names from query', 'drugs': [], 'results': {}})}\n\n"
            return

        # Step 2: Parallel search for all drugs
        all_drug_results = {}
        search_tasks = {}
        for drug in drugs:
            search_tasks[drug] = asyncio.create_task(
                search_all_pharmacies(drug, settings.tinyfish_api_key)
            )
            yield f"data: {json.dumps({'type': 'drug_search_started', 'drug': drug})}\n\n"

        for drug, task in search_tasks.items():
            try:
                results = await task
                best_price = None
                best_source = ""
                best_product = ""
                total_products = 0

                drug_sources = {}
                for sid, result in results.items():
                    if result.status == "success":
                        total_products += result.result_count
                        for p in result.products:
                            if best_price is None or p.price < best_price:
                                best_price = p.price
                                best_source = result.source_name
                                best_product = p.product_name
                        drug_sources[sid] = {
                            "source_name": result.source_name,
                            "products": [{"product_name": p.product_name, "price": p.price, "source_name": result.source_name} for p in result.products[:3]],
                            "lowest_price": result.lowest_price,
                        }

                all_drug_results[drug] = {
                    "best_price": best_price,
                    "best_source": best_source,
                    "best_product": best_product,
                    "total_products": total_products,
                    "sources": drug_sources,
                }

                yield f"data: {json.dumps({'type': 'drug_search_complete', 'drug': drug, 'best_price': best_price, 'best_source': best_source, 'total_products': total_products})}\n\n"
            except Exception as e:
                logger.error(f"NL search failed for {drug}: {e}")
                all_drug_results[drug] = {"best_price": None, "best_source": "", "error": str(e)}
                yield f"data: {json.dumps({'type': 'drug_search_complete', 'drug': drug, 'error': str(e)})}\n\n"

        # Step 3: Build sourcing matrix
        matrix = _build_sourcing_matrix(drugs, all_drug_results)

        # Step 4: LLM synthesis/recommendation
        recommendation = await _synthesize_recommendation(
            query, parsed, all_drug_results, matrix, settings.openrouter_api_key
        )

        yield f"data: {json.dumps({'type': 'nl_complete', 'drugs': drugs, 'results': all_drug_results, 'matrix': matrix, 'recommendation': recommendation}, default=str)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


def _build_sourcing_matrix(drugs: list[str], results: dict) -> dict:
    """Build optimal sourcing matrix: which drugs to buy from which pharmacy."""
    # For each pharmacy, calculate total cost if buying all drugs there
    source_totals: dict[str, dict] = {}  # source_name -> {total, drugs}

    # Optimized route: cheapest per drug
    optimized = []
    optimized_total = 0
    for drug in drugs:
        dr = results.get(drug, {})
        if dr.get("best_price"):
            optimized.append({"drug": drug, "source": dr["best_source"], "price": dr["best_price"], "product": dr.get("best_product", "")})
            optimized_total += dr["best_price"]

        # Aggregate single-source totals
        for sid, src_data in dr.get("sources", {}).items():
            sname = src_data["source_name"]
            if sname not in source_totals:
                source_totals[sname] = {"total": 0, "drugs_available": 0}
            lp = src_data.get("lowest_price")
            if lp is not None:
                source_totals[sname]["total"] += lp
                source_totals[sname]["drugs_available"] += 1

    # Best single-source
    best_single = None
    best_single_total = None
    for sname, data in source_totals.items():
        if data["drugs_available"] == len(drugs):
            if best_single_total is None or data["total"] < best_single_total:
                best_single = sname
                best_single_total = data["total"]

    return {
        "optimized_route": optimized,
        "optimized_total": optimized_total,
        "best_single_source": best_single,
        "best_single_total": best_single_total,
        "savings_vs_single": (best_single_total - optimized_total) if best_single_total else None,
        "source_totals": {k: v["total"] for k, v in source_totals.items()},
    }


async def _synthesize_recommendation(
    original_query: str, parsed: dict, results: dict, matrix: dict, api_key: str
) -> str:
    """Use LLM to generate a human-readable recommendation from results."""
    if not api_key:
        return ""

    drugs_summary = []
    for drug, dr in results.items():
        if dr.get("best_price"):
            drugs_summary.append(f"- {drug}: best {dr['best_price']:,} VND at {dr['best_source']}")
        else:
            drugs_summary.append(f"- {drug}: not found")

    context = f"""User asked: "{original_query}"
Parsed drugs: {', '.join(parsed.get('drugs', []))}
Preferences: {'generic preferred' if parsed.get('preferences', {}).get('generic') else 'no preference'}

Search results:
{chr(10).join(drugs_summary)}

Optimized total: {matrix.get('optimized_total', 0):,} VND (buying cheapest per drug)
Best single source: {matrix.get('best_single_source', 'N/A')} at {matrix.get('best_single_total', 0):,} VND
Savings from multi-source: {matrix.get('savings_vs_single', 0):,} VND"""

    messages = [
        {
            "role": "system",
            "content": (
                "You are a pharmaceutical procurement advisor for Vietnamese pharmacies. "
                "Give a concise 3-5 sentence recommendation based on the search results. "
                "Mention specific savings, recommend the optimal sourcing strategy, "
                "and note any drugs that weren't found. Be practical and direct. English only."
            ),
        },
        {"role": "user", "content": context},
    ]

    result = await _call_openrouter(messages, api_key, max_tokens=300)
    return result.strip() if result else ""
