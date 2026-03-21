"""Prescription OCR via OpenRouter GPT-4V"""
import httpx
import json
import base64
import logging

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


async def extract_drugs_from_image(image_data: bytes, api_key: str) -> list[str]:
    """Extract drug names from a prescription photo using GPT-4V via OpenRouter."""
    if not api_key:
        logger.warning("OpenRouter API key not configured")
        return []

    image_b64 = base64.b64encode(image_data).decode("utf-8")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": "openai/gpt-4o",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a pharmaceutical prescription reader. "
                                "Extract ALL drug/medication names from this prescription image. "
                                "Include dosage if visible (e.g., 'Metformin 500mg'). "
                                "Return ONLY a JSON array of drug name strings. "
                                "Example: [\"Metformin 500mg\", \"Losartan 50mg\", \"Amlodipine 5mg\"] "
                                "If no drugs are found or image is unclear, return []."
                            ),
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract all drug names from this prescription:"},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                                },
                            ],
                        },
                    ],
                    "max_tokens": 500,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()

            content = result["choices"][0]["message"]["content"]
            # Parse JSON array from response
            try:
                start = content.index("[")
                end = content.rindex("]") + 1
                drugs = json.loads(content[start:end])
                return [d.strip() for d in drugs if isinstance(d, str) and d.strip()]
            except (ValueError, json.JSONDecodeError):
                logger.error(f"Failed to parse OCR output: {content[:200]}")
                return []

    except Exception as e:
        logger.error(f"OCR error: {e}")
        return []
