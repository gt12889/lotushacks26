"""Supermemory recall API for the Next.js client."""
import logging

from fastapi import APIRouter, Query

from models.schemas import MemoryRecallResponse
from services import supermemory_mem

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")


@router.get("/memory/recall", response_model=MemoryRecallResponse)
async def recall_memory(
    q: str = Query(..., min_length=1, description="Search query (e.g. current drug name)"),
    user: str = Query(..., min_length=1, description="Opaque user id from the client"),
):
    """Return relevant past search snippets for this user from Supermemory."""
    tag = supermemory_mem.normalize_user_tag(user)
    if not supermemory_mem.is_enabled():
        return MemoryRecallResponse(enabled=False, snippets=[])
    if not tag:
        return MemoryRecallResponse(enabled=True, snippets=[])

    snippets = await supermemory_mem.recall_for_user(tag, q)
    return MemoryRecallResponse(enabled=True, snippets=snippets)
