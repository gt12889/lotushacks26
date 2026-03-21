"""Telegram Bot service for price alerts"""
import httpx
import logging

logger = logging.getLogger(__name__)

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


async def send_alert(message: str, bot_token: str, chat_id: str) -> bool:
    """Send a price alert via Telegram."""
    if not bot_token or not chat_id:
        logger.warning("Telegram not configured")
        return False

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                TELEGRAM_API_URL.format(token=bot_token),
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML",
                },
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Telegram send error: {e}")
        return False
