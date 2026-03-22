"""Prescription optimizer endpoint"""
import asyncio
import json
import logging
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import StreamingResponse
from models.schemas import OptimizeRequest, OptimizeResponse, OptimizeDrugResult
from services.tinyfish import search_all_pharmacies, search_all_pharmacies_batch
from services.ocr import extract_drugs_from_image
from config import settings
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


async def _get_cached_prices(drug: str) -> list[dict]:
    """Fall back to cached prices in DB when live search returns no results."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT product_name, price, source_id,
                      (SELECT name FROM sources WHERE id = p.source_id) as source_name
               FROM prices p
               WHERE LOWER(drug_query) LIKE LOWER(?)
               ORDER BY price ASC""",
            (f"%{drug.split()[0]}%",),
        )
        rows = await cursor.fetchall()
        # Deduplicate by product_name, keeping cheapest
        seen = {}
        for row in rows:
            name = row["product_name"]
            if name not in seen or row["price"] < seen[name]["price"]:
                seen[name] = dict(row)
        return list(seen.values())
    finally:
        await db.close()


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_prescription(request: OptimizeRequest):
    """Find cheapest sourcing across pharmacies for multiple drugs.

    Uses /run-batch for atomic multi-drug submission when API key is configured,
    falling back to individual parallel searches for mock mode.
    Falls back to cached DB prices when live search returns no results.
    """
    if settings.tinyfish_api_key:
        # Batch: single POST for all drugs x pharmacies
        all_results = await search_all_pharmacies_batch(
            request.drugs, settings.tinyfish_api_key
        )
    else:
        # Mock mode fallback: individual parallel searches
        search_tasks = [
            search_all_pharmacies(drug, settings.tinyfish_api_key)
            for drug in request.drugs
        ]
        gathered = await asyncio.gather(*search_tasks)
        all_results = dict(zip(request.drugs, gathered))

    items = []
    source_totals = {}

    for drug, results in all_results.items():
        best_price: int | None = None
        best_source = ""
        best_name = ""

        for source_id, result in results.items():
            if result.status == "success":
                for product in result.products:
                    if best_price is None or product.price < best_price:
                        best_price = product.price
                        best_source = result.source_name
                        best_name = product.product_name

        # Fallback: use cached DB prices when live search has no results
        if best_price is None:
            logger.info(f"Optimize: live search empty for '{drug}', falling back to cached DB prices")
            cached = await _get_cached_prices(drug)
            if cached:
                best_price = cached[0]["price"]
                best_source = cached[0]["source_name"] or cached[0]["source_id"]
                best_name = cached[0]["product_name"]

        if best_price is not None:
            items.append(OptimizeDrugResult(
                drug=drug,
                best_source=best_source,
                best_price=best_price,
                product_name=best_name,
            ))

    total_optimized = sum(i.best_price for i in items)

    # Calculate single-source comparison from live results
    for drug, results in all_results.items():
        for source_id, result in results.items():
            if result.status == "success" and result.products:
                cheapest = min(p.price for p in result.products)
                source_totals.setdefault(result.source_name, 0)
                source_totals[result.source_name] += cheapest

    # If no live source totals, build from cached DB prices
    if not source_totals and items:
        for drug in request.drugs:
            cached = await _get_cached_prices(drug)
            # Group by source, pick cheapest per source
            per_source: dict[str, int] = {}
            for row in cached:
                src = row["source_name"] or row["source_id"]
                if src not in per_source or row["price"] < per_source[src]:
                    per_source[src] = row["price"]
            for src, price in per_source.items():
                source_totals.setdefault(src, 0)
                source_totals[src] += price

    best_single = min(source_totals.items(), key=lambda x: x[1]) if source_totals else None

    return OptimizeResponse(
        items=items,
        total_optimized=total_optimized,
        total_single_source=best_single[1] if best_single else None,
        savings=(best_single[1] - total_optimized) if best_single else None,
        best_single_source=best_single[0] if best_single else None,
    )


@router.post("/optimize/stream")
async def optimize_prescription_stream(request: OptimizeRequest):
    """SSE streaming version of optimize -- shows per-drug progress."""

    async def event_generator():
        drugs = request.drugs
        yield f"data: {json.dumps({'type': 'optimize_start', 'drugs': drugs, 'total_drugs': len(drugs)})}\n\n"

        all_results: dict = {}
        for i, drug in enumerate(drugs):
            yield f"data: {json.dumps({'type': 'drug_started', 'drug': drug, 'index': i})}\n\n"

            results = await search_all_pharmacies(drug, settings.tinyfish_api_key)
            all_results[drug] = results

            best_price = None
            best_source = ""
            products_found = 0
            for sid, result in results.items():
                if result.status == "success":
                    products_found += result.result_count
                    for p in result.products:
                        if best_price is None or p.price < best_price:
                            best_price = p.price
                            best_source = result.source_name

            yield f"data: {json.dumps({'type': 'drug_complete', 'drug': drug, 'index': i, 'best_price': best_price, 'best_source': best_source, 'products_found': products_found})}\n\n"

        # Build final optimize response (same logic as optimize_prescription)
        items = []
        for drug, results in all_results.items():
            best_price = None
            best_source_name = ""
            best_name = ""
            for source_id, result in results.items():
                if result.status == "success":
                    for product in result.products:
                        if best_price is None or product.price < best_price:
                            best_price = product.price
                            best_source_name = result.source_name
                            best_name = product.product_name
            if best_price is not None:
                items.append(OptimizeDrugResult(
                    drug=drug,
                    best_source=best_source_name,
                    best_price=best_price,
                    product_name=best_name,
                ))

        total_optimized = sum(item.best_price for item in items)

        source_totals: dict[str, int] = {}
        for drug, results in all_results.items():
            for source_id, result in results.items():
                if result.status == "success" and result.products:
                    cheapest = min(p.price for p in result.products)
                    source_totals.setdefault(result.source_name, 0)
                    source_totals[result.source_name] += cheapest

        best_single = min(source_totals.items(), key=lambda x: x[1]) if source_totals else None
        savings = (best_single[1] - total_optimized) if best_single else None

        yield f"data: {json.dumps({'type': 'optimize_complete', 'items': [item.model_dump() for item in items], 'total_optimized': total_optimized, 'total_single_source': best_single[1] if best_single else None, 'savings': savings, 'best_single_source': best_single[0] if best_single else None})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


DEMO_PRESCRIPTION_FALLBACK = {
    "drugs": [
        {"name": "Metformin 500mg", "dosage": "500mg", "frequency": "2x daily", "quantity": 60},
        {"name": "Amlodipine 5mg", "dosage": "5mg", "frequency": "1x daily", "quantity": 30},
        {"name": "Losartan 50mg", "dosage": "50mg", "frequency": "1x daily", "quantity": 30},
    ]
}


@router.post("/optimize/prescription", response_model=OptimizeResponse)
async def optimize_from_prescription(image: UploadFile = File(...)):
    """Upload a prescription image → OCR extracts drugs → optimize across pharmacies.

    Chains OpenAI GPT-4o function calling (OCR) with TinyFish parallel search.
    Falls back to a hardcoded demo extraction if the API call fails or times out.
    """
    image_data = await image.read()
    api_key = settings.openai_api_key or settings.openrouter_api_key

    drugs = []
    try:
        drugs = await asyncio.wait_for(
            extract_drugs_from_image(image_data, api_key),
            timeout=8.0,
        )
    except asyncio.TimeoutError:
        logger.warning("OCR timed out after 8s — using demo fallback prescription")
    except Exception as e:
        logger.warning(f"OCR failed ({e}) — using demo fallback prescription")

    drug_names = [d["name"] for d in drugs if d.get("name")]

    if not drug_names:
        logger.info("OCR returned no drugs — using demo fallback prescription")
        drugs = DEMO_PRESCRIPTION_FALLBACK["drugs"]
        drug_names = [d["name"] for d in drugs]

    # Reuse existing optimize logic
    request = OptimizeRequest(drugs=drug_names)
    return await optimize_prescription(request)
