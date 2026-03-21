"""Demo alert endpoint - fires Discord + ElevenLabs alert for live demo."""
import logging
from fastapi import APIRouter
from pydantic import BaseModel
from services.elevenlabs import generate_audio
from services.discord import send_alert, send_alert_with_audio
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


class DemoAlertRequest(BaseModel):
    drug_name: str = "Metformin 500mg"
    best_price: int | None = None
    best_source: str | None = None


@router.post("/demo-alert")
async def fire_demo_alert(request: DemoAlertRequest):
    """Fire a real Discord alert with ElevenLabs Vietnamese voice note.

    Used during live demos to showcase ElevenLabs + Discord sponsor integrations.
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

    # Send to Discord
    if not settings.discord_webhook_url:
        return {"status": "warning", "message": "Discord webhook not configured", "audio_generated": audio is not None}

    try:
        if audio:
            await send_alert_with_audio(discord_msg, audio, settings.discord_webhook_url)
        else:
            await send_alert(discord_msg, settings.discord_webhook_url)
    except Exception as e:
        logger.error(f"Demo alert Discord error: {e}")
        return {"status": "error", "message": f"Discord send failed: {e}", "audio_generated": audio is not None}

    return {
        "status": "sent",
        "message": "Alert sent to Discord" + (" with Vietnamese voice note" if audio else " (text only)"),
        "audio_generated": audio is not None,
        "sponsors": ["ElevenLabs", "Discord"],
    }
