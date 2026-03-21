"""TinyFish service - parallel pharmacy web scraping"""
import asyncio
import hashlib
import httpx
import json
import logging
import time
from collections import OrderedDict
from models.schemas import ProductResult, PharmacySearchResult
from services.normalizer import normalize_drug_name, fuzzy_match_score
from config import settings as app_settings

logger = logging.getLogger(__name__)

# In-memory cache: key=(query+source_id) -> (timestamp, PharmacySearchResult)
_cache: OrderedDict[str, tuple[float, PharmacySearchResult]] = OrderedDict()
CACHE_TTL = 900  # 15 minutes
CACHE_MAX_SIZE = 200


def _cache_key(query: str, source_id: str) -> str:
    return hashlib.md5(f"{query.lower().strip()}:{source_id}".encode()).hexdigest()


def _get_cached(query: str, source_id: str) -> PharmacySearchResult | None:
    key = _cache_key(query, source_id)
    if key in _cache:
        ts, result = _cache[key]
        if time.time() - ts < CACHE_TTL:
            # Add cache metadata
            age = int(time.time() - ts)
            logger.info(f"Cache HIT for {source_id}:{query} (age: {age}s)")
            return result
        else:
            del _cache[key]
    return None


def _set_cached(query: str, source_id: str, result: PharmacySearchResult):
    key = _cache_key(query, source_id)
    _cache[key] = (time.time(), result)
    # Evict oldest entries if cache too large
    while len(_cache) > CACHE_MAX_SIZE:
        _cache.popitem(last=False)

TINYFISH_API_URL = "https://agent.tinyfish.ai/v1/automation/run-sse"

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

# Additional mock data for other common drugs
MOCK_AMOXICILLIN = {
    "long_chau": [
        ProductResult(product_name="Amoxicillin 500mg Domesco (hộp 100 viên)", price=65000, manufacturer="Domesco", dosage_form="capsule", pack_size=100, unit_price=650, in_stock=True, product_url="https://nhathuoclongchau.com.vn/amoxicillin-domesco"),
    ],
    "pharmacity": [
        ProductResult(product_name="Amoxicillin Stada 500mg (hộp 20 viên)", price=28000, manufacturer="Stada", dosage_form="capsule", pack_size=20, unit_price=1400, in_stock=True, product_url="https://pharmacity.vn/amoxicillin-stada"),
    ],
    "an_khang": [
        ProductResult(product_name="Amoxicillin 500mg DHG (hộp 100 viên)", price=72000, manufacturer="DHG Pharma", dosage_form="capsule", pack_size=100, unit_price=720, in_stock=True, product_url="https://ankhang.vn/amoxicillin-dhg"),
    ],
    "than_thien": [
        ProductResult(product_name="Amoxicillin 500mg Vidipha (hộp 100 viên)", price=58000, manufacturer="Vidipha", dosage_form="capsule", pack_size=100, unit_price=580, in_stock=True, product_url="https://nhathuocthanhtien.vn/amoxicillin-vidipha"),
    ],
    "medicare": [
        ProductResult(product_name="Augmentin 500mg/125mg GSK (hộp 14 viên)", price=185000, manufacturer="GSK", dosage_form="tablet", pack_size=14, unit_price=13214, in_stock=True, product_url="https://medicare.vn/augmentin-500mg"),
    ],
}

MOCK_PARACETAMOL = {
    "long_chau": [
        ProductResult(product_name="Paracetamol 500mg Nadyphar (hộp 100 viên)", price=18000, manufacturer="Nadyphar", dosage_form="tablet", pack_size=100, unit_price=180, in_stock=True, product_url="https://nhathuoclongchau.com.vn/paracetamol-nadyphar"),
    ],
    "pharmacity": [
        ProductResult(product_name="Panadol Extra (hộp 12 viên)", price=32000, original_price=36000, manufacturer="GSK", dosage_form="tablet", pack_size=12, unit_price=2667, in_stock=True, product_url="https://pharmacity.vn/panadol-extra"),
    ],
    "an_khang": [
        ProductResult(product_name="Efferalgan 500mg (hộp 16 viên)", price=45000, manufacturer="Upsa", dosage_form="effervescent", pack_size=16, unit_price=2813, in_stock=True, product_url="https://ankhang.vn/efferalgan-500mg"),
    ],
    "than_thien": [
        ProductResult(product_name="Paracetamol 500mg TV.Pharm (hộp 100 viên)", price=15000, manufacturer="TV.Pharm", dosage_form="tablet", pack_size=100, unit_price=150, in_stock=True, product_url="https://nhathuocthanhtien.vn/paracetamol-tvpharm"),
    ],
    "medicare": [
        ProductResult(product_name="Tylenol 500mg (hộp 10 viên)", price=55000, manufacturer="Janssen", dosage_form="tablet", pack_size=10, unit_price=5500, in_stock=True, product_url="https://medicare.vn/tylenol-500mg"),
    ],
}

MOCK_DATA_BY_QUERY = {
    "metformin": MOCK_RESULTS,
    "amoxicillin": MOCK_AMOXICILLIN,
    "paracetamol": MOCK_PARACETAMOL,
    "panadol": MOCK_PARACETAMOL,
}


AGENT_TIMEOUT = 15.0  # seconds for mock mode, 120s for live TinyFish


async def search_single_pharmacy_safe(source_id: str, query: str, api_key: str, timeout: float = 15.0) -> PharmacySearchResult:
    """Timeout-isolated wrapper around search_single_pharmacy."""
    config = PHARMACY_CONFIGS.get(source_id)
    name = config["name"] if config else "Unknown"
    try:
        # Use longer timeout for real TinyFish (it navigates real sites)
        effective_timeout = 180.0 if api_key else timeout
        return await asyncio.wait_for(
            search_single_pharmacy(source_id, query, api_key),
            timeout=effective_timeout,
        )
    except asyncio.TimeoutError:
        logger.warning(f"Agent timeout for {source_id} after {timeout}s")
        return PharmacySearchResult(
            source_id=source_id,
            source_name=name,
            status="error",
            error=f"Timeout after {timeout}s",
            response_time_ms=int(timeout * 1000),
        )
    except Exception as e:
        logger.error(f"Agent error for {source_id}: {e}")
        return PharmacySearchResult(
            source_id=source_id,
            source_name=name,
            status="error",
            error=str(e),
        )


async def search_single_pharmacy(
    source_id: str, query: str, api_key: str
) -> PharmacySearchResult:
    """Search a single pharmacy using TinyFish agent."""
    config = PHARMACY_CONFIGS.get(source_id)
    if not config:
        return PharmacySearchResult(
            source_id=source_id, source_name="Unknown", status="error", error="Unknown source"
        )

    # Check cache first
    cached = _get_cached(query, source_id)
    if cached is not None:
        return cached

    start_time = time.time()

    if not api_key:
        # Return mock data based on query
        await asyncio.sleep(0.5 + hash(source_id) % 3)  # Simulate varied response times
        query_lower = query.lower()
        mock_set = MOCK_RESULTS  # default
        for key, data in MOCK_DATA_BY_QUERY.items():
            if key in query_lower:
                mock_set = data
                break
        mock_products = mock_set.get(source_id, [])
        elapsed = int((time.time() - start_time) * 1000)
        lowest = min((p.price for p in mock_products), default=None)
        result = PharmacySearchResult(
            source_id=source_id,
            source_name=config["name"],
            status="success",
            products=mock_products,
            lowest_price=lowest,
            result_count=len(mock_products),
            response_time_ms=elapsed,
        )
        _set_cached(query, source_id, result)
        return result

    url = config["search_url"].format(query=query)
    goal = config["goal"].format(query=query)

    try:
        request_body = {"goal": goal, "url": url}
        # Add BrightData proxy for Long Chau (largest chain, most likely to block)
        if source_id == "long_chau" and app_settings.brightdata_proxy_url:
            request_body["proxy-config"] = {
                "enabled": True,
                "url": app_settings.brightdata_proxy_url,
            }

        async with httpx.AsyncClient(timeout=120.0) as client:
            # TinyFish uses SSE streaming - collect all events
            async with client.stream(
                "POST",
                TINYFISH_API_URL,
                json=request_body,
                headers={
                    "X-API-Key": api_key,
                    "Content-Type": "application/json",
                },
            ) as response:
                response.raise_for_status()
                output_text = ""
                async for line in response.aiter_lines():
                    if not line or line.startswith(":"):
                        continue
                    logger.info(f"TinyFish SSE [{source_id}]: {line[:200]}")
                    if line.startswith("data: "):
                        data = line[6:]
                    elif line.startswith("data:"):
                        data = line[5:]
                    else:
                        data = line
                    try:
                        event = json.loads(data)
                        # Capture any field that might contain the result
                        for key in ("result", "output", "data", "content", "text", "message"):
                            if key in event and event[key]:
                                output_text = event[key]
                    except json.JSONDecodeError:
                        # Raw text - might be the result itself
                        if "[" in data or "{" in data:
                            output_text = data

            if not output_text:
                output_text = "[]"

        if isinstance(output_text, str):
            try:
                start = output_text.index("[")
                end = output_text.rindex("]") + 1
                products_data = json.loads(output_text[start:end])
            except (ValueError, json.JSONDecodeError):
                logger.error(f"Failed to parse TinyFish output for {source_id}: {output_text[:200]}")
                products_data = []
        elif isinstance(output_text, list):
            products_data = output_text
        else:
            products_data = []

        products = []
        for p in products_data:
            try:
                product_name = p.get("product_name", "Unknown")
                # Filter out irrelevant results using fuzzy matching
                if fuzzy_match_score(query, product_name) < 0.3:
                    logger.debug(f"Filtered low-relevance product: {product_name}")
                    continue
                price = int(str(p.get("price", 0)).replace(".", "").replace(",", ""))
                if price <= 0:
                    continue
                pack_size = int(p.get("pack_size", 1)) or 1
                orig = p.get("original_price")
                if orig:
                    orig = int(str(orig).replace(".", "").replace(",", ""))
                products.append(ProductResult(
                    product_name=product_name,
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
        result = PharmacySearchResult(
            source_id=source_id,
            source_name=config["name"],
            status="success",
            products=products,
            lowest_price=lowest,
            result_count=len(products),
            response_time_ms=elapsed,
        )
        _set_cached(query, source_id, result)
        return result

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
        search_single_pharmacy_safe(sid, query, api_key)
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
