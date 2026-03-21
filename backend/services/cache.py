"""Redis cache service for GhostDriver"""
import json
import logging
import redis.asyncio as aioredis
from config import settings

logger = logging.getLogger(__name__)

CACHE_TTL = 86400  # 24 hours in seconds

_redis_client: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis | None:
    """Get or create Redis connection."""
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
            )
            await _redis_client.ping()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Caching disabled.")
            _redis_client = None
    return _redis_client


async def get_cached_violations(plate_number: str) -> list[dict] | None:
    """Get cached violation records for a plate number."""
    client = await get_redis()
    if not client:
        return None

    try:
        key = f"violations:{plate_number}"
        data = await client.get(key)
        if data:
            logger.info(f"Cache HIT for plate {plate_number}")
            return json.loads(data)
        logger.info(f"Cache MISS for plate {plate_number}")
        return None
    except Exception as e:
        logger.error(f"Cache read error: {e}")
        return None


async def set_cached_violations(plate_number: str, violations: list[dict]) -> None:
    """Cache violation records for a plate number with 24h TTL."""
    client = await get_redis()
    if not client:
        return

    try:
        key = f"violations:{plate_number}"
        await client.set(key, json.dumps(violations), ex=CACHE_TTL)
        logger.info(f"Cached violations for plate {plate_number} (TTL: {CACHE_TTL}s)")
    except Exception as e:
        logger.error(f"Cache write error: {e}")


async def close_redis() -> None:
    """Close Redis connection on shutdown."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
