"""Discord webhook service for price alerts with voice"""
import httpx
import logging
import io

logger = logging.getLogger(__name__)


async def send_alert(message: str, webhook_url: str, **kwargs) -> bool:
    """Send a price alert via Discord webhook."""
    if not webhook_url:
        logger.warning("Discord webhook URL not configured")
        return False

    content = message.replace("<b>", "**").replace("</b>", "**")
    content = content.replace("<i>", "*").replace("</i>", "*")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                webhook_url,
                json={"content": content, "username": "MediScrape Bot"},
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Discord send error: {e}")
        return False


async def send_alert_with_audio(message: str, audio_bytes: bytes, webhook_url: str) -> bool:
    """Send a Discord alert with an attached MP3 audio file."""
    if not webhook_url:
        logger.warning("Discord webhook URL not configured")
        return False

    content = message.replace("<b>", "**").replace("</b>", "**")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                webhook_url,
                data={"content": content, "username": "MediScrape Bot"},
                files={"file": ("alert.mp3", audio_bytes, "audio/mpeg")},
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Discord audio send error: {e}")
        return False
