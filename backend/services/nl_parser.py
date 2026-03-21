"""Parse natural language queries into structured drug search lists via OpenRouter."""
import json
import logging
from services.qwen import _call_openrouter

logger = logging.getLogger(__name__)


async def parse_nl_query(text: str, api_key: str) -> dict:
    """Parse a natural language drug request into structured search plan.

    Returns: {"drugs": ["Metformin 500mg", ...], "preferences": {"generic": bool}, "summary": "..."}
    """
    if not api_key or not text:
        return {"drugs": [], "preferences": {}, "summary": text}

    messages = [
        {
            "role": "system",
            "content": (
                "You are a pharmaceutical assistant. Parse the user's natural language request "
                "into specific drug names to search for in Vietnamese pharmacies.\n\n"
                "Return JSON:\n"
                '{"drugs": ["DrugName Dosage", ...], "preferences": {"generic": true/false, "brand": "preferred brand or null"}, '
                '"summary": "Brief 1-line summary of what user needs"}\n\n'
                "Rules:\n"
                "- Extract 1-5 specific drug names with common dosages\n"
                "- If user mentions a condition (diabetes, hypertension), map to standard first-line drugs\n"
                "- If user says 'generic preferred', set generic: true\n"
                "- Always include dosage if inferrable (e.g., Metformin 500mg, Amlodipine 5mg)\n"
                "- Return ONLY valid JSON, no markdown"
            ),
        },
        {"role": "user", "content": text},
    ]

    result = await _call_openrouter(messages, api_key, max_tokens=300)
    if not result:
        return {"drugs": [], "preferences": {}, "summary": text}

    try:
        clean = result.strip()
        if clean.startswith("```"):
            lines = clean.split("\n")
            lines = [l for l in lines[1:] if not l.strip().startswith("```")]
            clean = "\n".join(lines).strip()
        parsed = json.loads(clean)
        if isinstance(parsed, dict) and "drugs" in parsed:
            return parsed
    except (ValueError, json.JSONDecodeError):
        logger.warning(f"NL parser failed to parse: {result[:200]}")

    return {"drugs": [], "preferences": {}, "summary": text}
