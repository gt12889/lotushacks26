"""Twilio voice call service — calls user with ElevenLabs-generated audio on price alerts."""
import base64
import logging
import httpx

logger = logging.getLogger(__name__)


async def make_voice_call(
    audio_bytes: bytes,
    account_sid: str,
    auth_token: str,
    from_number: str,
    to_number: str,
    public_api_url: str | None = None,
) -> bool:
    """Place a Twilio call that plays ElevenLabs audio via TwiML <Play>.

    Flow:
    1. Upload audio to our own /api/twilio/audio endpoint (served as static mp3)
    2. Call Twilio REST API to initiate call with TwiML pointing to that audio
    """
    if not all([account_sid, auth_token, from_number, to_number]):
        logger.warning("Twilio not fully configured — skipping call")
        return False

    # We use inline TwiML with a base64 audio approach via <Say> fallback
    # and <Play> pointing to our hosted audio endpoint
    api_url = public_api_url or "http://localhost:8000"
    audio_url = f"{api_url}/api/twilio/audio/latest.mp3"

    # Store audio for the TwiML callback to serve
    _store_latest_audio(audio_bytes)

    twiml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f'<Play>{audio_url}</Play>'
        "<Pause length=\"1\"/>"
        "<Say voice=\"alice\" language=\"vi-VN\">Megalodon MD price alert. Check your dashboard.</Say>"
        "</Response>"
    )

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Calls.json",
                auth=(account_sid, auth_token),
                data={
                    "To": to_number,
                    "From": from_number,
                    "Twiml": twiml,
                },
            )
            if response.status_code in (200, 201):
                call_sid = response.json().get("sid", "unknown")
                logger.info(f"Twilio call initiated: {call_sid} to {to_number}")
                return True
            else:
                logger.error(f"Twilio call failed ({response.status_code}): {response.text[:300]}")
                return False
    except Exception as e:
        logger.error(f"Twilio call error: {e}")
        return False


# In-memory audio store for the TwiML callback
_latest_audio: bytes | None = None


def _store_latest_audio(audio_bytes: bytes):
    global _latest_audio
    _latest_audio = audio_bytes


def get_latest_audio() -> bytes | None:
    return _latest_audio
