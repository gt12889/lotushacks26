"""TinyFish health check service"""
import asyncio
import httpx
import time
import logging

logger = logging.getLogger(__name__)

TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"

_health_status = {
    "tinyfish": {"status": "unknown", "last_check": None, "latency_ms": None},
}


async def check_tinyfish_health(api_key: str) -> dict:
    """Ping TinyFish API to verify connectivity."""
    if not api_key:
        _health_status["tinyfish"] = {"status": "not_configured", "last_check": time.time(), "latency_ms": None}
        return _health_status["tinyfish"]

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Just check if the endpoint responds (HEAD or small POST)
            response = await client.post(
                TINYFISH_API_URL,
                json={"url": "https://example.com", "goal": "Return the page title"},
                headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            )
            latency = int((time.time() - start) * 1000)
            # Any response (even 400) means TinyFish is reachable
            status = "connected" if response.status_code < 500 else "degraded"
            _health_status["tinyfish"] = {"status": status, "last_check": time.time(), "latency_ms": latency}
    except Exception as e:
        _health_status["tinyfish"] = {"status": "unreachable", "last_check": time.time(), "latency_ms": None, "error": str(e)}
        logger.warning(f"TinyFish health check failed: {e}")

    return _health_status["tinyfish"]


def get_health_status() -> dict:
    """Get cached health status."""
    return dict(_health_status)


async def periodic_health_check(api_key: str, interval: int = 300):
    """Background task: check TinyFish health every N seconds."""
    while True:
        await check_tinyfish_health(api_key)
        await asyncio.sleep(interval)
