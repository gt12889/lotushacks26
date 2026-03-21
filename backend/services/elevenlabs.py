"""ElevenLabs service - Vietnamese voice alerts"""
import httpx
import logging

logger = logging.getLogger(__name__)

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech"

# Verified working voices with eleven_multilingual_v2 (supports Vietnamese)
# Primary: Sarah (clear female, good Vietnamese pronunciation)
# Fallback: Rachel (warm female, reliable)
VOICE_IDS = ["EXAVITQu4vr4xnSDxMaL", "21m00Tcm4TlvDq8ikWAM"]

# Voice settings optimized for Vietnamese tonal language
# Higher stability for consistent tones, moderate boost for clarity
VOICE_SETTINGS = {
    "stability": 0.65,           # Higher for Vietnamese tonal accuracy
    "similarity_boost": 0.80,    # Clear articulation
    "style": 0.15,               # Slight expressiveness for alerts
    "use_speaker_boost": True,   # Enhance clarity
}

MAX_TEXT_LENGTH = 250  # Keep short to conserve credits


async def generate_audio(text: str, api_key: str) -> bytes | None:
    """Generate Vietnamese speech audio with fallback voices."""
    if not api_key or not text:
        return None

    # Truncate to conserve credits
    if len(text) > MAX_TEXT_LENGTH:
        text = text[:MAX_TEXT_LENGTH].rsplit(" ", 1)[0] + "."

    for voice_id in VOICE_IDS:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{ELEVENLABS_API_URL}/{voice_id}",
                    json={
                        "text": text,
                        "model_id": "eleven_multilingual_v2",
                        "voice_settings": VOICE_SETTINGS,
                    },
                    headers={
                        "xi-api-key": api_key,
                        "Content-Type": "application/json",
                        "Accept": "audio/mpeg",
                    },
                )
                if response.status_code == 200:
                    logger.info(f"ElevenLabs audio generated ({len(response.content)} bytes, voice: {voice_id})")
                    return response.content
                elif response.status_code == 401 and "quota" in response.text.lower():
                    logger.warning(f"ElevenLabs quota exceeded for voice {voice_id}")
                    continue  # Try next voice
                else:
                    logger.warning(f"ElevenLabs voice {voice_id} failed: {response.status_code}")
                    continue
        except Exception as e:
            logger.error(f"ElevenLabs error with voice {voice_id}: {e}")
            continue

    logger.error("All ElevenLabs voices failed")
    return None
