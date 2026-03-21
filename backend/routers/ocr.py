"""OCR endpoint for prescription photo processing"""
from fastapi import APIRouter, UploadFile, File
from services.ocr import extract_drugs_from_image
from config import settings

router = APIRouter(prefix="/api")


@router.post("/ocr")
async def process_prescription(image: UploadFile = File(...)):
    """Extract drug names from a prescription photo."""
    image_data = await image.read()
    drugs = await extract_drugs_from_image(image_data, settings.openrouter_api_key)
    return {"drugs": drugs, "count": len(drugs)}
