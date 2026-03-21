"""TinyFish service - violation history lookup via csgt.vn"""
import httpx
import json
import logging
from models.schemas import ViolationRecord
from services.cache import get_cached_violations, set_cached_violations

logger = logging.getLogger(__name__)

TINYFISH_API_URL = "https://api.tinyfish.io/v1/agent/run"


async def fetch_violations(plate_number: str, vehicle_type: str, api_key: str) -> list[ViolationRecord]:
    """Use TinyFish agent to navigate csgt.vn, solve CAPTCHA, and extract violations."""
    if not api_key:
        logger.warning("TinyFish API key not configured, returning empty results")
        return []

    # Check cache first
    cached = await get_cached_violations(plate_number)
    if cached is not None:
        return [ViolationRecord(**v) for v in cached]

    prompt = (
        f"Navigate to https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html. "
        f"Enter license plate number '{plate_number}' and select vehicle type '{vehicle_type}'. "
        f"Solve any CAPTCHA presented. "
        f"Return ALL violation records as a JSON array with fields: "
        f"date (string YYYY-MM-DD), description (string in Vietnamese), "
        f"status (string: 'paid' or 'unpaid'), fine_amount (number in VND), "
        f"location (string, optional). "
        f"If no violations found, return an empty array []."
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                TINYFISH_API_URL,
                json={
                    "goal": prompt,
                    "url": "https://www.csgt.vn/tra-cuu-phuong-tien-vi-pham.html",
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()

            # Parse the agent's output - extract JSON from response
            output_text = result.get("output", result.get("result", "[]"))
            if isinstance(output_text, str):
                # Try to extract JSON array from text
                try:
                    start = output_text.index("[")
                    end = output_text.rindex("]") + 1
                    violations_data = json.loads(output_text[start:end])
                except (ValueError, json.JSONDecodeError):
                    logger.error(f"Failed to parse TinyFish output: {output_text[:200]}")
                    return []
            elif isinstance(output_text, list):
                violations_data = output_text
            else:
                return []

            violations = [ViolationRecord(**v) for v in violations_data]

            # Cache the results
            await set_cached_violations(
                plate_number, [v.model_dump() for v in violations]
            )

            return violations

    except httpx.TimeoutException:
        logger.error(f"TinyFish timeout for plate {plate_number}")
        return []
    except Exception as e:
        logger.error(f"TinyFish error: {e}")
        return []


async def fetch_registration(plate_number: str, api_key: str) -> dict | None:
    """Check vr.org.vn for vehicle registration and inspection validity."""
    if not api_key:
        return None

    prompt = (
        f"Navigate to https://vr.org.vn and search for vehicle with plate '{plate_number}'. "
        f"Return registration status and inspection validity as JSON with fields: "
        f"registration_valid (boolean), inspection_expiry (string date), owner_type (string)."
    )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                TINYFISH_API_URL,
                json={"goal": prompt, "url": "https://vr.org.vn"},
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()
            output_text = result.get("output", result.get("result", "{}"))
            if isinstance(output_text, str):
                try:
                    start = output_text.index("{")
                    end = output_text.rindex("}") + 1
                    return json.loads(output_text[start:end])
                except (ValueError, json.JSONDecodeError):
                    return None
            return output_text if isinstance(output_text, dict) else None
    except Exception as e:
        logger.error(f"Registration lookup error: {e}")
        return None
