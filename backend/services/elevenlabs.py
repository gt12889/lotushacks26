"""ElevenLabs service - Vietnamese voice alerts"""
import httpx
import logging

logger = logging.getLogger(__name__)

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"
VIETNAMESE_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"


async def generate_audio(text: str, api_key: str) -> bytes | None:
    """Generate Vietnamese speech audio."""
    if not api_key or not text:
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{ELEVENLABS_API_URL}/{VIETNAMESE_VOICE_ID}",
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                    },
                },
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
            )
            response.raise_for_status()
            return response.content
    except Exception as e:
        logger.error(f"ElevenLabs error: {e}")
        return None
