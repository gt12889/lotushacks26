"""Personalized insights — recall + OpenRouter."""
from fastapi import APIRouter

from models.schemas import InsightsRequest, InsightsResponse
from services.shopping_insights import generate_insight

router = APIRouter(prefix="/api")


@router.post("/insights", response_model=InsightsResponse)
async def post_insights(body: InsightsRequest):
    """English personalized note from current scan + Supermemory recall (optional)."""
    enabled, insight, n_mem, err = await generate_insight(
        user_raw=body.user,
        drug_query=body.drug_query.strip(),
        current_scan=body.current_scan,
    )
    return InsightsResponse(
        enabled=enabled,
        insight=insight,
        memory_snippets_used=n_mem,
        error=err,
    )
