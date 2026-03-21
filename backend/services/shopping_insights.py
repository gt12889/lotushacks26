"""Personalized shopping notes: Supermemory recall + OpenRouter (English)."""
from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from config import settings
from models.schemas import CurrentScanSnapshot
from services import supermemory_mem

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
_MAX_BODY_CHARS = 6000
_MAX_SNIPPETS = 8


def _scan_block(scan: CurrentScanSnapshot) -> dict[str, Any]:
    return {
        "best_price_vnd": scan.best_price,
        "best_source": scan.best_source,
        "price_range": scan.price_range,
        "potential_savings_vnd": scan.potential_savings,
        "total_results": scan.total_results,
        "variants": scan.variants[:20],
        "price_fluctuations": scan.price_fluctuations[:12],
    }


async def generate_insight(
    *,
    user_raw: str,
    drug_query: str,
    current_scan: CurrentScanSnapshot,
) -> tuple[bool, str, int, str | None]:
    """
    Returns (openrouter_enabled, insight_text, memory_snippet_count, error_or_none).
    """
    api_key = (settings.openrouter_api_key or "").strip()
    if not api_key:
        return False, "", 0, None

    tag = supermemory_mem.normalize_user_tag(user_raw)
    snippets: list[str] = []
    if tag and supermemory_mem.is_enabled():
        snippets = await supermemory_mem.recall_for_user(tag, drug_query, limit=_MAX_SNIPPETS)

    payload = {
        "drug_query": drug_query,
        "current_scan": _scan_block(current_scan),
        "memory_snippets_from_prior_searches": snippets,
    }
    user_text = json.dumps(payload, ensure_ascii=False, indent=2)
    if len(user_text) > _MAX_BODY_CHARS:
        user_text = user_text[: _MAX_BODY_CHARS] + "\n…(truncated)"

    system = (
        "You are a concise shopping assistant for comparing prescription drug prices "
        "across Vietnamese pharmacy chains (MediScrape). "
        "Write in clear English only. Use ONLY the JSON facts and memory snippets provided—do not invent prices or medical facts. "
        "Do not give medical advice, diagnosis, or dosing guidance; you only discuss prices and where to shop. "
        "Produce 3 to 6 short sentences. If memory snippets are empty, still summarize the current scan. "
        "Mention Vietnam / VND where relevant."
    )

    try:
        async with httpx.AsyncClient(timeout=28.0) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                json={
                    "model": settings.insights_model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user_text},
                    ],
                    "max_tokens": 400,
                    "temperature": 0.35,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
            text = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
            text = (text or "").strip()
            return True, text, len(snippets), None
    except Exception as e:
        logger.warning("shopping insight OpenRouter error: %s", e)
        return True, "", len(snippets), str(e)
