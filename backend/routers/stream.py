"""SSE streaming endpoint for real-time analysis progress"""
import asyncio
import json
import uuid
import logging
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from models.schemas import VehicleType, SceneAnalysis
from services.tinyfish import fetch_violations
from services.falai import analyze_scene
from services.exa import search_legal_references
from services.synthesis import synthesize_report
from services.jigsawstack import generate_pdf
from services.elevenlabs import generate_audio
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Store for SSE-generated reports
_sse_reports: dict[str, dict] = {}
_sse_pdfs: dict[str, bytes] = {}
_sse_audios: dict[str, bytes] = {}


async def _run_task(name: str, coro, events: asyncio.Queue):
    """Run a task and emit progress events."""
    await events.put({"task": name, "status": "running"})
    try:
        result = await coro
        await events.put({"task": name, "status": "complete"})
        return result
    except Exception as e:
        logger.error(f"Task {name} failed: {e}")
        await events.put({"task": name, "status": "error", "error": str(e)})
        return None


@router.post("/analyze/stream")
async def analyze_stream(
    plate_number: str = Form(...),
    vehicle_type: VehicleType = Form(...),
    image: UploadFile = File(...),
    location: str = Form(None),
    time: str = Form(None),
    description: str = Form(None),
):
    image_data = await image.read()
    report_id = str(uuid.uuid4())[:8]

    async def event_generator():
        events = asyncio.Queue()

        # Start all three tasks
        violations_task = asyncio.create_task(
            _run_task("violations", fetch_violations(plate_number, vehicle_type.value, settings.tinyfish_api_key), events)
        )
        scene_task = asyncio.create_task(
            _run_task("scene", analyze_scene(image_data, settings.falai_api_key), events)
        )
        legal_task = asyncio.create_task(
            _run_task("legal", search_legal_references(description or "", vehicle_type.value, settings.exa_api_key), events)
        )

        # Emit events as tasks complete
        tasks_done = 0
        total_events = 6  # 3 running + 3 complete/error
        while tasks_done < total_events:
            try:
                event = await asyncio.wait_for(events.get(), timeout=65.0)
                yield f"data: {json.dumps(event)}\n\n"
                if event["status"] in ("complete", "error"):
                    tasks_done += 1
                    # After all 3 "running" + we count only completions
                if tasks_done >= 3:
                    # All running events sent + at least some completions
                    pass
            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'task': 'system', 'status': 'timeout'})}\n\n"
                break

        # Wait for all results
        violations = await violations_task
        scene = await scene_task
        legal = await legal_task

        # Emit synthesis stage
        yield f"data: {json.dumps({'task': 'synthesis', 'status': 'running'})}\n\n"

        from models.schemas import SceneAnalysis as SA, LegalReference as LR, ViolationRecord as VR

        # Apply mock fallbacks
        if not violations:
            from routers.analyze import MOCK_VIOLATIONS
            violations = MOCK_VIOLATIONS
        if not isinstance(scene, SA) or scene is None:
            from routers.analyze import MOCK_SCENE
            scene = MOCK_SCENE
        if not legal:
            from routers.analyze import MOCK_LEGAL
            legal = MOCK_LEGAL

        report = await synthesize_report(
            violations=violations,
            scene=scene,
            legal_refs=legal,
            openai_api_key=settings.openai_api_key,
            qwen_api_key=settings.qwen_api_key,
            description=description or "",
        )

        yield f"data: {json.dumps({'task': 'synthesis', 'status': 'complete'})}\n\n"

        # Generate outputs
        yield f"data: {json.dumps({'task': 'outputs', 'status': 'running'})}\n\n"

        pdf_url = None
        audio_url = None

        pdf_bytes = await generate_pdf(report, settings.jigsawstack_api_key)
        if pdf_bytes:
            _sse_pdfs[report_id] = pdf_bytes
            pdf_url = f"/stream/reports/{report_id}/pdf"

        audio_bytes = await generate_audio(report.summary_text, settings.elevenlabs_api_key)
        if audio_bytes:
            _sse_audios[report_id] = audio_bytes
            audio_url = f"/stream/reports/{report_id}/audio"

        yield f"data: {json.dumps({'task': 'outputs', 'status': 'complete'})}\n\n"

        # Send final result
        result = {
            "task": "result",
            "status": "complete",
            "data": {
                "report": report.model_dump(),
                "pdf_url": pdf_url,
                "audio_url": audio_url,
                "report_id": report_id,
            }
        }
        yield f"data: {json.dumps(result, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# PDF/Audio endpoints for SSE-generated reports
import io
from fastapi import HTTPException
from fastapi.responses import StreamingResponse as SR


@router.get("/stream/reports/{report_id}/pdf")
async def download_sse_pdf(report_id: str):
    if report_id not in _sse_pdfs:
        raise HTTPException(status_code=404, detail="PDF not found")
    return SR(
        io.BytesIO(_sse_pdfs[report_id]),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=ghostdriver-{report_id}.pdf"},
    )


@router.get("/stream/reports/{report_id}/audio")
async def play_sse_audio(report_id: str):
    if report_id not in _sse_audios:
        raise HTTPException(status_code=404, detail="Audio not found")
    return SR(
        io.BytesIO(_sse_audios[report_id]),
        media_type="audio/mpeg",
    )
