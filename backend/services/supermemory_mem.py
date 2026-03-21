"""Supermemory — per-user drug search history and preferences (MediScrape).

Uses ``search.memories`` with ``search_mode='hybrid'`` for recall; document indexing
is asynchronous, so recall right after ``add`` may be empty for a few seconds.
"""
from __future__ import annotations

import asyncio
import logging
import re
from functools import lru_cache
from typing import Any

from supermemory import Supermemory

from config import settings

logger = logging.getLogger(__name__)

_TAG_RE = re.compile(r"[^a-zA-Z0-9._-]+")


@lru_cache(maxsize=1)
def get_supermemory() -> Supermemory:
    key = (settings.supermemory_api_key or "").strip()
    if key:
        return Supermemory(api_key=key)
    return Supermemory()


def is_enabled() -> bool:
    return bool((settings.supermemory_api_key or "").strip())


def normalize_user_tag(user_id: str) -> str | None:
    """Supermemory container tags: alphanumeric, ``._-``, max 100 chars."""
    if not user_id or not user_id.strip():
        return None
    cleaned = _TAG_RE.sub("-", user_id.strip())[:100].strip("-")
    return cleaned or None


def _recall_snippets(resp: Any, limit: int) -> list[str]:
    out: list[str] = []
    for r in (resp.results or [])[:limit]:
        text = getattr(r, "chunk", None) or getattr(r, "memory", None)
        if text and text not in out:
            out.append(text)
    return out


async def recall_for_user(user_tag: str, q: str, *, limit: int = 5) -> list[str]:
    if not is_enabled() or not user_tag.strip() or not q.strip():
        return []

    def _run() -> list[str]:
        client = get_supermemory()
        resp = client.search.memories(
            q=q,
            container_tag=user_tag,
            limit=limit,
            rerank=True,
            rewrite_query=True,
            search_mode="hybrid",
        )
        return _recall_snippets(resp, limit)

    try:
        return await asyncio.to_thread(_run)
    except Exception as e:
        logger.warning("Supermemory recall failed: %s", e)
        return []


async def remember_search_session(
    user_tag: str,
    drug_query: str,
    *,
    best_price: int | None,
    best_source: str | None,
    potential_savings: int | None,
) -> None:
    if not is_enabled() or not user_tag:
        return
    parts = [f'MediScrape search for drug "{drug_query}"']
    if best_price is not None and best_source:
        parts.append(f"best price {best_price:,} VND at {best_source}")
    if potential_savings:
        parts.append(f"potential savings up to {potential_savings:,} VND vs highest listing")
    content = ". ".join(parts) + "."

    def _run() -> None:
        get_supermemory().add(content=content, container_tags=[user_tag])

    try:
        await asyncio.to_thread(_run)
    except Exception as e:
        logger.warning("Supermemory add failed: %s", e)
