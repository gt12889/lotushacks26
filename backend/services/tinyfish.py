"""TinyFish service - parallel pharmacy web scraping"""
import asyncio
import httpx
import json
import logging
import time
from models.schemas import ProductResult, PharmacySearchResult

logger = logging.getLogger(__name__)

TINYFISH_API_URL = "https://api.tinyfish.io/v1/agent/run"

PHARMACY_CONFIGS = {
    "long_chau": {
        "name": "FPT Long Chau",
        "search_url": "https://nhathuoclongchau.com.vn/tim-kiem?key={query}",
        "goal": """Search for '{query}' on this pharmacy website.
Extract ALL matching products on the results page.
For each product, return a JSON array with:
- product_name (full name including dosage)
- price (number in VND, remove dots/commas)
- original_price (if on sale, the crossed-out price, else null)
- manufacturer (brand/company name)
- dosage_form (tablet, capsule, syrup, etc.)
- pack_size (number of units per package, default 1)
- in_stock (boolean)
- product_url (full URL to product page)
Return as valid JSON array. If no results found, return [].""",
    },
    "pharmacity": {
        "name": "Pharmacity",
        "search_url": "https://www.pharmacity.vn/search?q={query}",
        "goal": """Search for '{query}' on this pharmacy website.
Extract ALL matching products visible on the search results page.
For each product, return JSON array with:
- product_name, price (VND number), original_price (or null),
  manufacturer, dosage_form, pack_size, in_stock, product_url
Return as valid JSON array. If no results, return [].""",
    },
    "an_khang": {
        "name": "An Khang",
        "search_url": "https://www.ankhang.vn/search?q={query}",
        "goal": """Search for '{query}' on this pharmacy website.
Extract ALL matching products from search results.
For each product return JSON array with:
- product_name, price (VND number), original_price (or null),
  manufacturer, dosage_form, pack_size, in_stock, product_url
Return as valid JSON array. If no results, return [].""",
    },
    "than_thien": {
        "name": "Nha Thuoc Than Thien",
        "search_url": "https://nhathuocthanhtien.vn/?s={query}",
        "goal": """Search for '{query}' on this pharmacy website.
Extract ALL matching products from search results.
For each product return JSON array with:
- product_name, price (VND number), original_price (or null),
  manufacturer, dosage_form, pack_size, in_stock, product_url
Return as valid JSON array. If no results, return [].""",
    },
    "medicare": {
        "name": "Medicare Vietnam",
        "search_url": "https://medicare.vn/search?q={query}",
        "goal": """Search for '{query}' on this pharmacy website.
Extract ALL matching products from search results.
For each product return JSON array with:
- product_name, price (VND number), original_price (or null),
  manufacturer, dosage_form, pack_size, in_stock, product_url
Return as valid JSON array. If no results, return [].""",
    },
}

# Mock data for when TinyFish API key is not configured
MOCK_RESULTS = {
    "long_chau": [
        ProductResult(product_name="Metformin Stada 500mg (hộp 100 viên)", price=45000, original_price=52000, manufacturer="Stada", dosage_form="tablet", pack_size=100, unit_price=450, in_stock=True, product_url="https://nhathuoclongchau.com.vn/metformin-stada-500mg"),
        ProductResult(product_name="Metformin Denk 500mg (hộp 50 viên)", price=38000, manufacturer="Denk Pharma", dosage_form="tablet", pack_size=50, unit_price=760, in_stock=True, product_url="https://nhathuoclongchau.com.vn/metformin-denk-500mg"),
    ],
    "pharmacity": [
        ProductResult(product_name="Glucophage 500mg (hộp 50 viên)", price=89000, manufacturer="Merck", dosage_form="tablet", pack_size=50, unit_price=1780, in_stock=True, product_url="https://pharmacity.vn/glucophage-500mg"),
        ProductResult(product_name="Metformin 500mg Domesco (hộp 100 viên)", price=55000, manufacturer="Domesco", dosage_form="tablet", pack_size=100, unit_price=550, in_stock=True, product_url="https://pharmacity.vn/metformin-domesco"),
    ],
    "an_khang": [
        ProductResult(product_name="Metformin Stada 500mg (hộp 100 viên)", price=48000, manufacturer="Stada", dosage_form="tablet", pack_size=100, unit_price=480, in_stock=True, product_url="https://ankhang.vn/metformin-stada"),
        ProductResult(product_name="Glucophage XR 500mg (hộp 30 viên)", price=135000, manufacturer="Merck", dosage_form="tablet", pack_size=30, unit_price=4500, in_stock=False, product_url="https://ankhang.vn/glucophage-xr"),
    ],
    "than_thien": [
        ProductResult(product_name="Metformin 500mg Stada (hộp 100 viên)", price=42000, manufacturer="Stada", dosage_form="tablet", pack_size=100, unit_price=420, in_stock=True, product_url="https://nhathuocthanhtien.vn/metformin-stada"),
    ],
    "medicare": [
        ProductResult(product_name="Glucophage 500mg Merck (hộp 50 viên)", price=95000, manufacturer="Merck", dosage_form="tablet", pack_size=50, unit_price=1900, in_stock=True, product_url="https://medicare.vn/glucophage-500mg"),
    ],
}


async def search_single_pharmacy(
    source_id: str, query: str, api_key: str
) -> PharmacySearchResult:
    """Search a single pharmacy using TinyFish agent."""
    config = PHARMACY_CONFIGS.get(source_id)
    if not config:
        return PharmacySearchResult(
            source_id=source_id, source_name="Unknown", status="error", error="Unknown source"
        )

    start_time = time.time()

    if not api_key:
        # Return mock data
        await asyncio.sleep(0.5 + hash(source_id) % 3)  # Simulate varied response times
        mock_products = MOCK_RESULTS.get(source_id, [])
        elapsed = int((time.time() - start_time) * 1000)
        lowest = min((p.price for p in mock_products), default=None)
        return PharmacySearchResult(
            source_id=source_id,
            source_name=config["name"],
            status="success",
            products=mock_products,
            lowest_price=lowest,
            result_count=len(mock_products),
            response_time_ms=elapsed,
        )

    url = config["search_url"].format(query=query)
    goal = config["goal"].format(query=query)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                TINYFISH_API_URL,
                json={"goal": goal, "url": url},
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            result = response.json()

            output_text = result.get("output", result.get("result", "[]"))
            if isinstance(output_text, str):
                try:
                    start = output_text.index("[")
                    end = output_text.rindex("]") + 1
                    products_data = json.loads(output_text[start:end])
                except (ValueError, json.JSONDecodeError):
                    logger.error(f"Failed to parse TinyFish output for {source_id}")
                    products_data = []
            elif isinstance(output_text, list):
                products_data = output_text
            else:
                products_data = []

            products = []
            for p in products_data:
                try:
                    price = int(str(p.get("price", 0)).replace(".", "").replace(",", ""))
                    pack_size = int(p.get("pack_size", 1)) or 1
                    orig = p.get("original_price")
                    if orig:
                        orig = int(str(orig).replace(".", "").replace(",", ""))
                    products.append(ProductResult(
                        product_name=p.get("product_name", "Unknown"),
                        price=price,
                        original_price=orig,
                        manufacturer=p.get("manufacturer"),
                        dosage_form=p.get("dosage_form"),
                        pack_size=pack_size,
                        unit_price=price / pack_size if pack_size else None,
                        in_stock=p.get("in_stock", True),
                        product_url=p.get("product_url"),
                    ))
                except Exception as e:
                    logger.warning(f"Skipping product parse error: {e}")

            elapsed = int((time.time() - start_time) * 1000)
            lowest = min((p.price for p in products), default=None)
            return PharmacySearchResult(
                source_id=source_id,
                source_name=config["name"],
                status="success",
                products=products,
                lowest_price=lowest,
                result_count=len(products),
                response_time_ms=elapsed,
            )

    except Exception as e:
        elapsed = int((time.time() - start_time) * 1000)
        logger.error(f"TinyFish error for {source_id}: {e}")
        return PharmacySearchResult(
            source_id=source_id,
            source_name=config["name"],
            status="error",
            error=str(e),
            response_time_ms=elapsed,
        )


async def search_all_pharmacies(query: str, api_key: str, sources: list[str] | None = None) -> dict[str, PharmacySearchResult]:
    """Search all pharmacy sources in parallel."""
    target_sources = sources or list(PHARMACY_CONFIGS.keys())

    tasks = [
        search_single_pharmacy(sid, query, api_key)
        for sid in target_sources
    ]

    results = await asyncio.gather(*tasks, return_exceptions=True)

    aggregated = {}
    for sid, result in zip(target_sources, results):
        if isinstance(result, Exception):
            aggregated[sid] = PharmacySearchResult(
                source_id=sid,
                source_name=PHARMACY_CONFIGS.get(sid, {}).get("name", "Unknown"),
                status="error",
                error=str(result),
            )
        else:
            aggregated[sid] = result

    return aggregated
