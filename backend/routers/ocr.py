"""OCR endpoint for prescription photo processing"""
from fastapi import APIRouter, UploadFile, File
from services.ocr import extract_drugs_from_image
from config import settings

router = APIRouter(prefix="/api")


@router.post("/ocr")
async def process_prescription(image: UploadFile = File(...)):
    """Extract drug names from a prescription photo using OpenAI GPT-4o function calling.

    Returns structured drug data that can be fed directly into /api/optimize.
    """
    image_data = await image.read()

    # Try OpenAI first (for Codex challenge), fall back to OpenRouter
    api_key = settings.openai_api_key or settings.openrouter_api_key
    drugs = await extract_drugs_from_image(image_data, api_key)

    # Build both structured results and simple name list for optimizer compatibility
    drug_names = [d["name"] for d in drugs if d.get("name")]

    return {
        "drugs": drugs,
        "drug_names": drug_names,
        "count": len(drugs),
    }
