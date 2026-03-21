"""LLM normalization service via OpenRouter - Vietnamese pharmaceutical text normalization.

Uses configurable model selection with fallback chain.
"""
import httpx
import json
import logging
from config import settings as app_settings

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


async def _call_openrouter(messages: list, api_key: str, max_tokens: int = 200, model: str | None = None) -> str | None:
    """Make an OpenRouter call with model fallback chain."""
    models_to_try = [
        model or app_settings.openrouter_normalization_model,
        app_settings.openrouter_fallback_model,
    ]

    for m in models_to_try:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    OPENROUTER_API_URL,
                    json={
                        "model": m,
                        "messages": messages,
                        "max_tokens": max_tokens,
                        "temperature": 0.1,
                    },
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                )
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    logger.info(f"OpenRouter response via {m}")
                    return content
                else:
                    logger.warning(f"OpenRouter model {m} returned {response.status_code}, trying fallback")
                    continue
        except Exception as e:
            logger.warning(f"OpenRouter model {m} failed: {e}, trying fallback")
            continue

    logger.error("All OpenRouter models failed")
    return None


async def normalize_vietnamese_drug_text(text: str, api_key: str) -> str:
    """Use LLM to normalize Vietnamese pharmaceutical text."""
    if not api_key or not text:
        return text

    messages = [
        {
            "role": "system",
            "content": (
                "You normalize Vietnamese pharmaceutical product names. "
                "Extract: drug name, dosage, form, manufacturer. "
                'Return JSON: {"drug": "...", "dosage": "...", "form": "...", "manufacturer": "..."} '
                "If unsure about a field, use null."
            ),
        },
        {"role": "user", "content": text},
    ]

    result = await _call_openrouter(messages, api_key)
    return result if result else text


async def batch_normalize_products(product_names: list[str], api_key: str) -> list[dict]:
    """Normalize a batch of Vietnamese drug product names."""
    if not api_key or not product_names:
        return []

    text = "\n".join(f"{i+1}. {name}" for i, name in enumerate(product_names))

    messages = [
        {
            "role": "system",
            "content": (
                "You normalize Vietnamese pharmaceutical product names. "
                "For each product, extract: drug (generic name), dosage, form, manufacturer. "
                'Return a JSON array of objects: [{"drug": "...", "dosage": "...", "form": "...", "manufacturer": "..."}, ...] '
                "Use null for unknown fields."
            ),
        },
        {"role": "user", "content": text},
    ]

    result = await _call_openrouter(messages, api_key, max_tokens=1000)
    if not result:
        return []

    try:
        # Extract JSON array from response
        content = result.strip()
        if content.startswith("```"):
            lines = content.split("\n")
            lines = [l for l in lines[1:] if not l.strip().startswith("```")]
            content = "\n".join(lines).strip()

        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed

        # Try bracket extraction
        start = content.index("[")
        end = content.rindex("]") + 1
        return json.loads(content[start:end])
    except (ValueError, json.JSONDecodeError):
        return []
