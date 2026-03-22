"""TTS endpoint - Vietnamese voice summary via ElevenLabs after search"""
import logging
from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from services.elevenlabs import generate_audio
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


class TTSSummaryRequest(BaseModel):
    query: str
    best_price: float | None = None
    best_source: str | None = None
    potential_savings: float | None = None
    total_results: int = 0


def _build_vietnamese_summary(req: TTSSummaryRequest) -> str:
    """Build a concise Vietnamese summary string from search results."""
    parts = []

    if req.best_price and req.best_source:
        parts.append(
            f"{req.query}, giá rẻ nhất tại {req.best_source}, "
            f"{int(req.best_price):,} đồng".replace(",", ".")
        )

    if req.potential_savings and req.potential_savings > 0:
        savings_str = f"{int(req.potential_savings):,}".replace(",", ".")
        parts.append(f"tiết kiệm {savings_str} đồng so với nơi đắt nhất")

    if req.total_results:
        parts.append(f"Tìm thấy {req.total_results} sản phẩm")

    if not parts:
        parts.append(f"Không tìm thấy kết quả cho {req.query}")

    return ". ".join(parts) + "."


@router.post("/tts/summary")
async def tts_summary(req: TTSSummaryRequest):
    """Generate Vietnamese TTS audio summarizing search results."""
    if not settings.elevenlabs_api_key:
        return Response(status_code=503, content="ElevenLabs API key not configured")

    text = _build_vietnamese_summary(req)
    logger.info(f"TTS summary text: {text}")

    from services.elevenlabs import _quota_exhausted
    if _quota_exhausted:
        return Response(status_code=503, content="ElevenLabs quota exhausted — 0 credits remaining")

    audio = await generate_audio(text, settings.elevenlabs_api_key)
    if not audio:
        return Response(status_code=502, content="TTS generation failed")

    return Response(
        content=audio,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline", "X-TTS-Text": text},
    )
