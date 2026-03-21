"""Report endpoints - PDF download and audio playback"""
import io
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from models.schemas import EvidenceReport
from services.jigsawstack import generate_pdf
from services.elevenlabs import generate_audio
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# In-memory store for reports (in production, use a database)
_reports: dict[str, EvidenceReport] = {}
_pdfs: dict[str, bytes] = {}
_audios: dict[str, bytes] = {}


def store_report(report_id: str, report: EvidenceReport) -> None:
    _reports[report_id] = report


async def generate_and_store_outputs(report_id: str, report: EvidenceReport) -> tuple[str | None, str | None]:
    """Generate PDF and audio for a report, return URLs."""
    pdf_url = None
    audio_url = None

    # Generate PDF
    pdf_bytes = await generate_pdf(report, settings.jigsawstack_api_key)
    if pdf_bytes:
        _pdfs[report_id] = pdf_bytes
        pdf_url = f"/reports/{report_id}/pdf"

    # Generate audio
    audio_bytes = await generate_audio(report.summary_text, settings.elevenlabs_api_key)
    if audio_bytes:
        _audios[report_id] = audio_bytes
        audio_url = f"/reports/{report_id}/audio"

    return pdf_url, audio_url


@router.get("/reports/{report_id}/pdf")
async def download_pdf(report_id: str):
    if report_id not in _pdfs:
        raise HTTPException(status_code=404, detail="PDF not found")
    return StreamingResponse(
        io.BytesIO(_pdfs[report_id]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ghostdriver-report-{report_id}.pdf"},
    )


@router.get("/reports/{report_id}/audio")
async def play_audio(report_id: str):
    if report_id not in _audios:
        raise HTTPException(status_code=404, detail="Audio not found")
    return StreamingResponse(
        io.BytesIO(_audios[report_id]),
        media_type="audio/mpeg",
    )
