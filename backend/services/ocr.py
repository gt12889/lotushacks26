"""Prescription OCR via OpenAI GPT-4o with function calling."""
import base64
import json
import logging

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

# Function calling schema for structured drug extraction
EXTRACT_DRUGS_TOOL = {
    "type": "function",
    "function": {
        "name": "extract_prescription_drugs",
        "description": "Extract medication names and dosages found in a prescription image",
        "parameters": {
            "type": "object",
            "properties": {
                "drugs": {
                    "type": "array",
                    "description": "List of medications found in the prescription",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Drug/medication name (generic or brand)",
                            },
                            "dosage": {
                                "type": "string",
                                "description": "Dosage amount and unit (e.g., '500mg', '10ml')",
                            },
                            "frequency": {
                                "type": "string",
                                "description": "How often to take (e.g., 'twice daily', '1 tablet 3x/day')",
                            },
                            "quantity": {
                                "type": "string",
                                "description": "Total quantity prescribed (e.g., '30 tablets')",
                            },
                        },
                        "required": ["name"],
                    },
                },
            },
            "required": ["drugs"],
        },
    },
}


async def extract_drugs_from_image(
    image_data: bytes, api_key: str
) -> list[dict]:
    """Extract drug names from a prescription photo using OpenAI GPT-4o with function calling.

    Returns list of dicts with keys: name, dosage, frequency, quantity.
    Falls back to list of name-only dicts on partial failure.
    """
    if not api_key:
        logger.warning("OpenAI API key not configured")
        return []

    image_b64 = base64.b64encode(image_data).decode("utf-8")
    client = AsyncOpenAI(api_key=api_key)

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a pharmaceutical prescription reader. "
                        "Extract ALL drug/medication names from this prescription image. "
                        "Include dosage, frequency, and quantity when visible. "
                        "For Vietnamese prescriptions, transliterate drug names to their international generic names when possible."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all medications from this prescription:",
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_b64}"
                            },
                        },
                    ],
                },
            ],
            tools=[EXTRACT_DRUGS_TOOL],
            tool_choice={
                "type": "function",
                "function": {"name": "extract_prescription_drugs"},
            },
            max_tokens=500,
        )

        # Parse structured function calling response
        tool_call = response.choices[0].message.tool_calls[0]
        result = json.loads(tool_call.function.arguments)
        drugs = result.get("drugs", [])

        logger.info(f"OCR extracted {len(drugs)} drugs via function calling")
        return [d for d in drugs if isinstance(d, dict) and d.get("name")]

    except Exception as e:
        logger.error(f"OCR error: {e}")
        return []
