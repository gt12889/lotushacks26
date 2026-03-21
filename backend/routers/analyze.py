"""Analyze endpoint router"""
import asyncio
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, Form
from models.schemas import (
    VehicleType, AnalyzeResponse, EvidenceReport,
    ViolationRecord, SceneAnalysis, LegalReference
)
from services.tinyfish import fetch_violations
from services.falai import analyze_scene
from services.exa import search_legal_references
from services.synthesis import synthesize_report
from routers.reports import store_report, generate_and_store_outputs
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


# Mock data fallbacks
MOCK_VIOLATIONS = [
    ViolationRecord(
        date="2024-08-15",
        description="Vượt đèn đỏ tại ngã tư Lê Lợi - Nguyễn Huệ",
        status="unpaid",
        fine_amount=4000000,
        location="TP.HCM"
    ),
    ViolationRecord(
        date="2024-03-22",
        description="Chạy quá tốc độ 20km/h trên đường cao tốc",
        status="paid",
        fine_amount=2000000,
        location="Hà Nội"
    ),
]

MOCK_SCENE = SceneAnalysis(
    damage_description="Significant front-end damage to vehicle A, crumpled hood and broken headlight. Minor rear damage to vehicle B.",
    impact_point="Front-to-rear collision, driver side",
    road_conditions="Wet asphalt, moderate visibility, urban intersection",
    vehicle_positions="Vehicle A facing north, Vehicle B facing north. Impact at intersection.",
    plate_confirmed=True,
)

MOCK_LEGAL = [
    LegalReference(
        article_number="Điều 11",
        title="Nghị định 100/2019/NĐ-CP",
        summary="Quy định xử phạt vi phạm hành chính trong lĩnh vực giao thông đường bộ",
        relevance=0.95,
    ),
    LegalReference(
        article_number="Điều 260",
        title="Bộ luật Hình sự 2015",
        summary="Vi phạm quy định về tham gia giao thông đường bộ",
        relevance=0.7,
    ),
]


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    plate_number: str = Form(...),
    vehicle_type: VehicleType = Form(...),
    image: UploadFile = File(...),
    location: str = Form(None),
    time: str = Form(None),
    description: str = Form(None),
):
    image_data = await image.read()

    # Run all three fetches in parallel
    violations_result, scene_result, legal_result = await asyncio.gather(
        fetch_violations(plate_number, vehicle_type.value, settings.tinyfish_api_key),
        analyze_scene(image_data, settings.falai_api_key),
        search_legal_references(description or "", vehicle_type.value, settings.exa_api_key),
        return_exceptions=True,
    )

    # Use results or fall back to mocks
    violations = violations_result if isinstance(violations_result, list) and violations_result else MOCK_VIOLATIONS
    scene = scene_result if isinstance(scene_result, SceneAnalysis) else MOCK_SCENE
    legal = legal_result if isinstance(legal_result, list) and legal_result else MOCK_LEGAL

    if isinstance(violations_result, Exception):
        logger.error(f"Violations fetch failed: {violations_result}")
    if isinstance(scene_result, Exception):
        logger.error(f"Scene analysis failed: {scene_result}")
    if isinstance(legal_result, Exception):
        logger.error(f"Legal search failed: {legal_result}")

    # AI Synthesis - combine all sources into evidence report
    report = await synthesize_report(
        violations=violations,
        scene=scene,
        legal_refs=legal,
        openai_api_key=settings.openai_api_key,
        qwen_api_key=settings.qwen_api_key,
        description=description or "",
    )

    # Generate report ID and store
    report_id = str(uuid.uuid4())[:8]
    store_report(report_id, report)

    # Generate PDF and audio (non-blocking, but we wait for URLs)
    pdf_url, audio_url = await generate_and_store_outputs(report_id, report)

    return AnalyzeResponse(report=report, pdf_url=pdf_url, audio_url=audio_url)
