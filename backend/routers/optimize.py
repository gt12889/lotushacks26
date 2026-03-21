"""Prescription optimizer endpoint"""
import asyncio
from fastapi import APIRouter, UploadFile, File
from models.schemas import OptimizeRequest, OptimizeResponse, OptimizeDrugResult
from services.tinyfish import search_all_pharmacies, search_all_pharmacies_batch
from services.ocr import extract_drugs_from_image
from config import settings

router = APIRouter(prefix="/api")


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize_prescription(request: OptimizeRequest):
    """Find cheapest sourcing across pharmacies for multiple drugs.

    Uses /run-batch for atomic multi-drug submission when API key is configured,
    falling back to individual parallel searches for mock mode.
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

        if best_price is not None:
            items.append(OptimizeDrugResult(
                drug=drug,
                best_source=best_source,
                best_price=best_price,
                product_name=best_name,
            ))

    total_optimized = sum(i.best_price for i in items)

    # Calculate single-source comparison
    source_totals = {}
    for drug, results in all_results.items():
        for source_id, result in results.items():
            if result.status == "success" and result.products:
                cheapest = min(p.price for p in result.products)
                source_totals.setdefault(result.source_name, 0)
                source_totals[result.source_name] += cheapest

    best_single = min(source_totals.items(), key=lambda x: x[1]) if source_totals else None

    return OptimizeResponse(
        items=items,
        total_optimized=total_optimized,
        total_single_source=best_single[1] if best_single else None,
        savings=(best_single[1] - total_optimized) if best_single else None,
        best_single_source=best_single[0] if best_single else None,
    )


@router.post("/optimize/prescription", response_model=OptimizeResponse)
async def optimize_from_prescription(image: UploadFile = File(...)):
    """Upload a prescription image → OCR extracts drugs → optimize across pharmacies.

    Chains OpenAI GPT-4o function calling (OCR) with TinyFish parallel search.
    """
    image_data = await image.read()
    api_key = settings.openai_api_key or settings.openrouter_api_key
    drugs = await extract_drugs_from_image(image_data, api_key)

    drug_names = [d["name"] for d in drugs if d.get("name")]
    if not drug_names:
        return OptimizeResponse(items=[], total_optimized=0)

    # Reuse existing optimize logic
    request = OptimizeRequest(drugs=drug_names)
    return await optimize_prescription(request)
