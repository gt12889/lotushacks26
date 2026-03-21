"""Exa service - Vietnamese traffic law search"""
import httpx
import logging
from models.schemas import LegalReference

logger = logging.getLogger(__name__)

EXA_API_URL = "https://api.exa.ai/search"


async def search_legal_references(description: str, vehicle_type: str, api_key: str) -> list[LegalReference]:
    """Search for relevant Vietnamese traffic law articles using Exa."""
    if not api_key:
        logger.warning("Exa API key not configured, returning empty results")
        return []

    query = (
        f"Vietnamese traffic law violation penalty {vehicle_type} "
        f"{description or 'traffic accident'} "
        f"Nghị định 100/2019 xử phạt giao thông"
    )

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                EXA_API_URL,
                json={
                    "query": query,
                    "num_results": 5,
                    "use_autoprompt": True,
                    "type": "neural",
                    "contents": {
                        "text": {"max_characters": 500}
                    },
                },
                headers={
                    "x-api-key": api_key,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

            results = data.get("results", [])
            references = []
            for i, r in enumerate(results):
                title = r.get("title", "Unknown Article")
                text = r.get("text", "")
                url = r.get("url", "")

                # Try to extract article number from title or text
                article_number = f"Ref-{i+1}"
                for prefix in ["Điều", "Article", "Nghị định", "Thông tư"]:
                    if prefix in title:
                        parts = title.split(prefix)
                        if len(parts) > 1:
                            article_number = f"{prefix}{parts[1].split()[0] if parts[1].split() else ''}"
                            break

                references.append(LegalReference(
                    article_number=article_number,
                    title=title,
                    summary=text[:300] if text else url,
                    relevance=max(0.5, 1.0 - (i * 0.1)),
                ))

            return references

    except Exception as e:
        logger.error(f"Exa search error: {e}")
        return []
