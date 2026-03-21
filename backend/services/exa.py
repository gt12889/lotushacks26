"""Exa service - semantic drug search for variant discovery, WHO pricing, and drug info"""
import re
import time
import httpx
import logging

logger = logging.getLogger(__name__)

EXA_API_URL = "https://api.exa.ai/search"

# Simple in-memory cache (keyed by function:drug_name)
_exa_cache: dict[str, tuple[float, any]] = {}
EXA_CACHE_TTL = 3600  # 1 hour — drug data changes slowly

# Regex for drug-like names: capitalized word or word with digits (e.g., "Metformin", "500mg")
_DRUG_NAME_RE = re.compile(r"\b([A-Z][a-z]{2,}(?:\s?\d+\s?mg)?)\b")


def _cache_get(key: str):
    """Return cached value if fresh, else None."""
    if key in _exa_cache:
        ts, cached = _exa_cache[key]
        if time.time() - ts < EXA_CACHE_TTL:
            return cached
    return None


def _cache_set(key: str, value):
    _exa_cache[key] = (time.time(), value)


async def _exa_search(api_key: str, payload: dict) -> dict | None:
    """Shared Exa API caller with error handling."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                EXA_API_URL,
                json=payload,
                headers={
                    "x-api-key": api_key,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"Exa HTTP error ({e.response.status_code}): {e}")
    except httpx.TimeoutException:
        logger.error("Exa request timed out")
    except Exception as e:
        logger.error(f"Exa search error: {e}")
    return None


async def search_drug_variants(drug_name: str, api_key: str) -> list[str]:
    """Use Exa semantic search to find related drug names and generic alternatives.

    Uses includeText with the first word of the drug name to ensure results
    are actually about the target active ingredient.
    """
    if not api_key:
        logger.warning("Exa API key not configured")
        return []

    cache_key = f"variants:{drug_name.lower().strip()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.info(f"Exa cache HIT for variants:{drug_name}")
        return cached

    # Extract active ingredient (first word) for includeText precision filter
    active_ingredient = drug_name.strip().split()[0]
    query = f"{drug_name} generic alternative brand names Vietnam pharmacy"

    data = await _exa_search(api_key, {
        "query": query,
        "numResults": 5,
        "type": "auto",
        "includeText": [active_ingredient],
        "contents": {"highlights": {"maxCharacters": 500}},
    })

    if not data:
        return []

    variants = set()
    drug_lower = active_ingredient.lower()
    for result in data.get("results", []):
        texts = [result.get("title", "")]
        texts.extend(result.get("highlights", []))
        for content in texts:
            if not content:
                continue
            for match in _DRUG_NAME_RE.finditer(content):
                candidate = match.group(1).strip()
                if candidate.lower().startswith(drug_lower) or len(candidate) < 4:
                    continue
                variants.add(candidate)

    result_list = sorted(variants)[:5]
    _cache_set(cache_key, result_list)
    logger.info(f"Exa found {len(result_list)} variants for {drug_name}")
    return result_list


async def search_who_reference_price(drug_name: str, api_key: str) -> dict | None:
    """Search WHO/academic sources for international reference pricing.

    Returns a dict with reference_price_text, source_title, source_url, or None.
    Uses category="research paper" to target WHO and academic pricing data.
    """
    if not api_key:
        return None

    cache_key = f"who:{drug_name.lower().strip()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.info(f"Exa cache HIT for who:{drug_name}")
        return cached

    active_ingredient = drug_name.strip().split()[0]
    query = f"{active_ingredient} international reference price WHO essential medicines"

    data = await _exa_search(api_key, {
        "query": query,
        "numResults": 3,
        "type": "auto",
        "category": "research paper",
        "contents": {"highlights": {"maxCharacters": 300}},
    })

    if not data or not data.get("results"):
        _cache_set(cache_key, None)
        return None

    # Extract the most relevant pricing snippet
    best = data["results"][0]
    highlights = best.get("highlights", [])
    price_snippet = highlights[0] if highlights else None

    result = {
        "source_title": best.get("title", ""),
        "source_url": best.get("url", ""),
        "highlights": highlights[:2],
        "price_snippet": price_snippet,
    }
    _cache_set(cache_key, result)
    logger.info(f"Exa WHO reference found for {drug_name}: {best.get('title', '')[:60]}")
    return result


async def search_drug_info(drug_name: str, api_key: str) -> dict | None:
    """Search for drug summary info (indications, side effects, dosage).

    Returns an LLM-generated summary plus key highlights for display in a
    drug info panel alongside the price comparison grid.
    """
    if not api_key:
        return None

    cache_key = f"info:{drug_name.lower().strip()}"
    cached = _cache_get(cache_key)
    if cached is not None:
        logger.info(f"Exa cache HIT for info:{drug_name}")
        return cached

    active_ingredient = drug_name.strip().split()[0]
    query = f"{active_ingredient} side effects dosage indications drug information"

    data = await _exa_search(api_key, {
        "query": query,
        "numResults": 3,
        "type": "auto",
        "includeText": [active_ingredient],
        "contents": {
            "summary": True,
            "highlights": {"maxCharacters": 300},
        },
    })

    if not data or not data.get("results"):
        _cache_set(cache_key, None)
        return None

    best = data["results"][0]
    result = {
        "summary": best.get("summary", ""),
        "source_title": best.get("title", ""),
        "source_url": best.get("url", ""),
        "highlights": best.get("highlights", [])[:3],
    }
    _cache_set(cache_key, result)
    logger.info(f"Exa drug info found for {drug_name}: {best.get('title', '')[:60]}")
    return result
