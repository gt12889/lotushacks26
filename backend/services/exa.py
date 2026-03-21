"""Exa service - semantic drug name search for variant discovery"""
import re
import time
import httpx
import logging

logger = logging.getLogger(__name__)

EXA_API_URL = "https://api.exa.ai/search"

# Simple in-memory cache for Exa results
_exa_cache: dict[str, tuple[float, list[str]]] = {}
EXA_CACHE_TTL = 3600  # 1 hour — drug variants change slowly

# Regex for drug-like names: capitalized word or word with digits (e.g., "Metformin", "500mg")
_DRUG_NAME_RE = re.compile(r"\b([A-Z][a-z]{2,}(?:\s?\d+\s?mg)?)\b")


async def search_drug_variants(drug_name: str, api_key: str) -> list[str]:
    """Use Exa semantic search to find related drug names and generic alternatives."""
    if not api_key:
        logger.warning("Exa API key not configured")
        return []

    # Check cache
    cache_key = drug_name.lower().strip()
    if cache_key in _exa_cache:
        ts, cached = _exa_cache[cache_key]
        if time.time() - ts < EXA_CACHE_TTL:
            logger.info(f"Exa cache HIT for {drug_name}")
            return cached

    query = f"Vietnamese pharmacy generic alternative for {drug_name} thuốc thay thế"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                EXA_API_URL,
                json={
                    "query": query,
                    "num_results": 5,
                    "use_autoprompt": True,
                    "type": "neural",
                    "contents": {"text": {"max_characters": 200}},
                },
                headers={
                    "x-api-key": api_key,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

            variants = set()
            drug_lower = drug_name.lower().split()[0]
            for result in data.get("results", []):
                # Extract from both title and text content
                for field in ("title", "text"):
                    content = result.get(field, "")
                    if not content:
                        continue
                    # Use regex to find drug-like names
                    for match in _DRUG_NAME_RE.finditer(content):
                        candidate = match.group(1).strip()
                        # Skip the original drug name and very short matches
                        if candidate.lower().startswith(drug_lower) or len(candidate) < 4:
                            continue
                        variants.add(candidate)

            result_list = sorted(variants)[:5]
            _exa_cache[cache_key] = (time.time(), result_list)
            logger.info(f"Exa found {len(result_list)} variants for {drug_name}")
            return result_list

    except httpx.HTTPStatusError as e:
        logger.error(f"Exa HTTP error ({e.response.status_code}): {e}")
        return []
    except httpx.TimeoutException:
        logger.error(f"Exa timeout for {drug_name}")
        return []
    except Exception as e:
        logger.error(f"Exa search error: {e}")
        return []
