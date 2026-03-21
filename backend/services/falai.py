"""Fal.AI service - incident scene analysis via vision model"""
import httpx
import json
import base64
import logging
from models.schemas import SceneAnalysis

logger = logging.getLogger(__name__)

FAL_API_URL = "https://fal.run/fal-ai/any-llm/vision"


async def analyze_scene(image_data: bytes, api_key: str) -> SceneAnalysis | None:
    """Send incident photo to Fal.AI vision model for scene analysis."""
    if not api_key:
        logger.warning("Fal.AI API key not configured, returning None")
        return None

    image_b64 = base64.b64encode(image_data).decode("utf-8")

    prompt = (
        "Analyze this traffic incident photo. Return a JSON object with these exact fields:\n"
        "- damage_description: describe all visible damage to vehicles\n"
        "- impact_point: identify the point and angle of collision\n"
        "- road_conditions: describe road surface, weather visibility, road type\n"
        "- vehicle_positions: describe relative positions of all vehicles\n"
        "- plate_confirmed: boolean, whether a license plate is clearly visible\n"
        "Return ONLY valid JSON, no other text."
    )

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                FAL_API_URL,
                json={
                    "model": "google/gemini-flash-1.5",
                    "prompt": prompt,
                    "image_url": f"data:image/jpeg;base64,{image_b64}",
                },
                headers={
                    "Authorization": f"Key {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()

            output_text = result.get("output", result.get("result", ""))
            if isinstance(output_text, str):
                try:
                    start = output_text.index("{")
                    end = output_text.rindex("}") + 1
                    scene_data = json.loads(output_text[start:end])
                except (ValueError, json.JSONDecodeError):
                    logger.error(f"Failed to parse Fal.AI output: {output_text[:200]}")
                    return None
            elif isinstance(output_text, dict):
                scene_data = output_text
            else:
                return None

            return SceneAnalysis(**scene_data)

    except Exception as e:
        logger.error(f"Fal.AI error: {e}")
        return None
