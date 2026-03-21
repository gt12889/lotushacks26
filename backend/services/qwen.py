"""Qwen service via OpenRouter - Vietnamese pharmaceutical text normalization"""
import httpx
import json
import logging

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


async def normalize_vietnamese_drug_text(text: str, api_key: str) -> str:
    """Use Qwen to normalize Vietnamese pharmaceutical text."""
    if not api_key or not text:
        return text

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": "qwen/qwen-2.5-72b-instruct",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You normalize Vietnamese pharmaceutical product names. "
                                "Extract: drug name, dosage, form, manufacturer. "
                                "Return JSON: {\"drug\": \"...\", \"dosage\": \"...\", \"form\": \"...\", \"manufacturer\": \"...\"} "
                                "If unsure about a field, use null."
                            ),
                        },
                        {"role": "user", "content": text},
                    ],
                    "max_tokens": 200,
                    "temperature": 0.1,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

    except Exception as e:
        logger.error(f"Qwen normalization error: {e}")
        return text


async def batch_normalize_products(product_names: list[str], api_key: str) -> list[dict]:
    """Normalize a batch of Vietnamese drug product names."""
    if not api_key or not product_names:
        return []

    text = "\n".join(f"{i+1}. {name}" for i, name in enumerate(product_names))

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": "qwen/qwen-2.5-72b-instruct",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You normalize Vietnamese pharmaceutical product names. "
                                "For each product, extract: drug (generic name), dosage, form, manufacturer. "
                                "Return a JSON array of objects: [{\"drug\": \"...\", \"dosage\": \"...\", \"form\": \"...\", \"manufacturer\": \"...\"}, ...] "
                                "Use null for unknown fields."
                            ),
                        },
                        {"role": "user", "content": text},
                    ],
                    "max_tokens": 1000,
                    "temperature": 0.1,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()
            content = result["choices"][0]["message"]["content"]

            try:
                start = content.index("[")
                end = content.rindex("]") + 1
                return json.loads(content[start:end])
            except (ValueError, json.JSONDecodeError):
                return []

    except Exception as e:
        logger.error(f"Qwen batch normalization error: {e}")
        return []
