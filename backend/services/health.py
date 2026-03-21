"""Health check service for all external dependencies"""
import asyncio
import httpx
import time
import logging

logger = logging.getLogger(__name__)

TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"
EXA_API_URL = "https://api.exa.ai/search"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models"

_health_status = {
    "tinyfish": {"status": "unknown", "last_check": None, "latency_ms": None},
    "exa": {"status": "unknown", "last_check": None, "latency_ms": None},
    "openrouter": {"status": "unknown", "last_check": None, "latency_ms": None},
    "brightdata_proxy": {"status": "unknown", "last_check": None, "latency_ms": None},
}


async def check_tinyfish_health(api_key: str) -> dict:
    """Ping TinyFish API to verify connectivity."""
    if not api_key:
        _health_status["tinyfish"] = {"status": "not_configured", "last_check": time.time(), "latency_ms": None}
        return _health_status["tinyfish"]

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                TINYFISH_API_URL,
                json={"url": "https://example.com", "goal": "Return the page title"},
                headers={"X-API-Key": api_key, "Content-Type": "application/json"},
            )
            latency = int((time.time() - start) * 1000)
            status = "connected" if response.status_code < 500 else "degraded"
            _health_status["tinyfish"] = {"status": status, "last_check": time.time(), "latency_ms": latency}
    except Exception as e:
        _health_status["tinyfish"] = {"status": "unreachable", "last_check": time.time(), "latency_ms": None, "error": str(e)}
        logger.warning(f"TinyFish health check failed: {e}")

    return _health_status["tinyfish"]


async def check_exa_health(api_key: str) -> dict:
    """Check Exa API connectivity."""
    if not api_key:
        _health_status["exa"] = {"status": "not_configured", "last_check": time.time(), "latency_ms": None}
        return _health_status["exa"]

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                EXA_API_URL,
                json={"query": "test", "num_results": 1, "type": "neural"},
                headers={"x-api-key": api_key, "Content-Type": "application/json"},
            )
            latency = int((time.time() - start) * 1000)
            status = "connected" if response.status_code < 500 else "degraded"
            if response.status_code == 401:
                status = "auth_error"
            _health_status["exa"] = {"status": status, "last_check": time.time(), "latency_ms": latency}
    except Exception as e:
        _health_status["exa"] = {"status": "unreachable", "last_check": time.time(), "latency_ms": None, "error": str(e)}
        logger.warning(f"Exa health check failed: {e}")

    return _health_status["exa"]


async def check_openrouter_health(api_key: str) -> dict:
    """Check OpenRouter API connectivity via models endpoint (free, no credits used)."""
    if not api_key:
        _health_status["openrouter"] = {"status": "not_configured", "last_check": time.time(), "latency_ms": None}
        return _health_status["openrouter"]

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                OPENROUTER_API_URL,
                headers={"Authorization": f"Bearer {api_key}"},
            )
            latency = int((time.time() - start) * 1000)
            status = "connected" if response.status_code < 500 else "degraded"
            if response.status_code == 401:
                status = "auth_error"
            _health_status["openrouter"] = {"status": status, "last_check": time.time(), "latency_ms": latency}
    except Exception as e:
        _health_status["openrouter"] = {"status": "unreachable", "last_check": time.time(), "latency_ms": None, "error": str(e)}
        logger.warning(f"OpenRouter health check failed: {e}")

    return _health_status["openrouter"]


async def check_proxy_health(proxy_url: str) -> dict:
    """Check BrightData proxy reachability."""
    if not proxy_url:
        _health_status["brightdata_proxy"] = {"status": "not_configured", "last_check": time.time(), "latency_ms": None}
        return _health_status["brightdata_proxy"]

    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=10.0, proxy=proxy_url) as client:
            response = await client.get("https://httpbin.org/ip")
            latency = int((time.time() - start) * 1000)
            status = "connected" if response.status_code == 200 else "degraded"
            _health_status["brightdata_proxy"] = {"status": status, "last_check": time.time(), "latency_ms": latency}
    except Exception as e:
        _health_status["brightdata_proxy"] = {"status": "unreachable", "last_check": time.time(), "latency_ms": None, "error": str(e)}
        logger.warning(f"BrightData proxy health check failed: {e}")

    return _health_status["brightdata_proxy"]


def get_health_status() -> dict:
    """Get cached health status for all services."""
    return dict(_health_status)


async def periodic_health_check(
    tinyfish_key: str,
    exa_key: str = "",
    openrouter_key: str = "",
    proxy_url: str = "",
    interval: int = 300,
):
    """Background task: check all service health every N seconds."""
    while True:
        await asyncio.gather(
            check_tinyfish_health(tinyfish_key),
            check_exa_health(exa_key),
            check_openrouter_health(openrouter_key),
            check_proxy_health(proxy_url),
            return_exceptions=True,
        )
        await asyncio.sleep(interval)
