"""Demo alert endpoint - fires Discord + ElevenLabs + Twilio alerts for live demo."""
import logging
from fastapi import APIRouter
from fastapi.responses import Response
from pydantic import BaseModel
from services.elevenlabs import generate_audio
from services.discord import send_alert, send_alert_with_audio
from services.twilio_call import make_voice_call, get_latest_audio
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


class DemoAlertRequest(BaseModel):
    drug_name: str = "Metformin 500mg"
    best_price: int | None = None
    best_source: str | None = None
    call: bool = False  # Set true to also trigger a Twilio phone call


@router.post("/demo-alert")
async def fire_demo_alert(request: DemoAlertRequest):
    """Fire a real Discord alert with ElevenLabs Vietnamese voice note.

    If call=true, also places a Twilio phone call with the same audio.
    """
    # Build Vietnamese alert message
    price_str = f"{request.best_price:,} VND" if request.best_price else "giá tốt nhất"
    source_str = request.best_source or "nhiều nhà thuốc"
    vn_text = (
        f"Cảnh báo giá thuốc! {request.drug_name} hiện có giá {price_str} "
        f"tại {source_str}. Đây là giá tốt nhất trong 5 nhà thuốc được quét."
    )

    # English Discord message
    discord_msg = (
        f"🔔 **Price Alert: {request.drug_name}**\n"
        f"Best price: {price_str} at {source_str}\n"
        f"_Scanned across 5 Vietnamese pharmacy chains via TinyFish agents_\n\n"
        f"🇻🇳 Vietnamese voice note attached (ElevenLabs)"
    )

    # Generate Vietnamese voice audio
    audio = await generate_audio(vn_text, settings.elevenlabs_api_key)

    results = {
        "audio_generated": audio is not None,
        "discord_sent": False,
        "call_placed": False,
        "sponsors": ["ElevenLabs", "Discord"],
    }

    # Send to Discord
    if settings.discord_webhook_url:
        try:
            if audio:
                await send_alert_with_audio(discord_msg, audio, settings.discord_webhook_url)
            else:
                await send_alert(discord_msg, settings.discord_webhook_url)
            results["discord_sent"] = True
        except Exception as e:
            logger.error(f"Demo alert Discord error: {e}")

    # Place Twilio call if requested and audio was generated
    if request.call and audio:
        results["sponsors"].append("Twilio")
        # Determine public API URL for audio callback
        # In production this would be the Railway/public URL
        public_url = settings.cors_origins.split(",")[0].replace("3005", "8000") if settings.cors_origins else None
        call_ok = await make_voice_call(
            audio_bytes=audio,
            account_sid=settings.twilio_account_sid,
            auth_token=settings.twilio_auth_token,
            from_number=settings.twilio_from_number,
            to_number=settings.twilio_to_number,
            public_api_url=public_url,
        )
        results["call_placed"] = call_ok
    elif request.call and not audio:
        results["call_error"] = "No audio generated — cannot place voice call"

    results["status"] = "sent" if results["discord_sent"] or results["call_placed"] else "partial"
    return results


@router.get("/twilio/audio/latest.mp3")
async def serve_twilio_audio():
    """Serve the latest ElevenLabs audio for Twilio <Play> callback."""
    audio = get_latest_audio()
    if not audio:
        return Response(content=b"", status_code=404)
    return Response(content=audio, media_type="audio/mpeg")
