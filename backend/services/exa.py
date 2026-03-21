"""Exa service - semantic drug name search for variant discovery"""
import httpx
import logging

logger = logging.getLogger(__name__)

EXA_API_URL = "https://api.exa.ai/search"


async def search_drug_variants(drug_name: str, api_key: str) -> list[str]:
    """Use Exa semantic search to find related drug names and generic alternatives."""
    if not api_key:
        logger.warning("Exa API key not configured")
        return []

    query = f"Vietnamese pharmacy generic alternative for {drug_name} thuốc thay thế"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                EXA_API_URL,
                json={
                    "query": query,
                    "num_results": 5,
                    "use_autoprompt": True,
                    "type": "neural",
                    "contents": {"text": {"max_characters": 200}},
                },
                headers={
                    "x-api-key": api_key,
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()

            variants = []
            for result in data.get("results", []):
                title = result.get("title", "")
                text = result.get("text", "")
                # Extract drug names from titles/text
                for word in title.split():
                    if len(word) > 3 and word[0].isupper() and word.lower() != drug_name.lower().split()[0]:
                        variants.append(word)

            return list(set(variants))[:5]

    except Exception as e:
        logger.error(f"Exa search error: {e}")
        return []
