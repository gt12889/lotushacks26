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
TINYFISH_BATCH_URL = "https://agent.tinyfish.ai/v1/automation/run-batch"
TINYFISH_RUN_URL = "https://agent.tinyfish.ai/v1/automation/runs"


def _extract_json_array(text, source_id: str) -> list:
    """Safely extract a JSON array from text, handling markdown fences and nested content."""
    if isinstance(text, list):
        return text
    if not isinstance(text, str):
        return []

    # Strip markdown code fences if present
    cleaned = text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first and last fence lines
        lines = [l for l in lines[1:] if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()

    # Try direct parse first
    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list):
            return parsed
    except json.JSONDecodeError:
        pass

    # Find outermost balanced brackets
    depth = 0
    start_idx = None
    for i, ch in enumerate(cleaned):
        if ch == "[":
            if depth == 0:
                start_idx = i
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0 and start_idx is not None:
                try:
                    return json.loads(cleaned[start_idx : i + 1])
                except json.JSONDecodeError:
                    pass
                start_idx = None

    logger.error(f"Failed to parse TinyFish JSON for {source_id}: {cleaned[:200]}")
    return []

PHARMACY_CONFIGS = {
    "long_chau": {
        "name": "FPT Long Chau",
        "search_url": "https://nhathuoclongchau.com.vn/tim-kiem?key={query}",
        "goal": """You are on nhathuoclongchau.com.vn search results for '{query}'.

Step 1: If a cookie consent banner or popup appears, click "Dong y" or the X button to dismiss it.
Step 2: Wait for the product listing grid to fully load (spinner should disappear).
Step 3: If a CAPTCHA challenge appears, STOP immediately and return: {{"error": "CAPTCHA_DETECTED"}}
Step 4: If the page shows "Khong tim thay san pham" or zero product cards, return []
Step 5: Extract ALL visible product cards. For each product card, extract:
  - product_name: the full Vietnamese product name including dosage (e.g. "Metformin Stada 500mg (hop 100 vien)")
  - price: the bold/primary price number in VND as integer (remove dots, e.g. 45000 not "45.000")
  - original_price: if there is a crossed-out/strikethrough price, that number in VND; otherwise null
  - manufacturer: the brand or company name shown below the product name
  - dosage_form: "tablet", "capsule", "syrup", "cream", "injection", or "other"
  - pack_size: number of units in the package (look for "hop X vien" pattern), default 1
  - in_stock: true if purchasable, false if showing "Het hang" or "Tam het hang"
  - product_url: the full href link to the product detail page
Step 6: If a product shows "Lien he" instead of a price, set price to null and in_stock to false.

Return ONLY a valid JSON array. Example:
[{{"product_name":"Metformin Stada 500mg (hop 100 vien)","price":45000,"original_price":null,"manufacturer":"Stada","dosage_form":"tablet","pack_size":100,"in_stock":true,"product_url":"https://nhathuoclongchau.com.vn/..."}}]

If extraction fails for any reason, return:
{{"error": "EXTRACTION_FAILED", "reason": "brief description of what went wrong"}}""",
    },
    "pharmacity": {
        "name": "Pharmacity",
        "search_url": "https://www.pharmacity.vn/search?q={query}",
        "goal": """You are on pharmacity.vn search results for '{query}'.

Step 1: Dismiss any cookie banner or promotional popup by clicking X or "Dong y".
Step 2: Wait for the product grid to render. Products appear as cards with images.
Step 3: If a CAPTCHA appears, STOP and return: {{"error": "CAPTCHA_DETECTED"}}
Step 4: Scroll down once to trigger any lazy-loaded products.
Step 5: If "Khong tim thay ket qua" is displayed or no product cards exist, return []
Step 6: Extract ALL product cards visible. For each:
  - product_name: full name with dosage
  - price: the displayed VND price as integer (remove dot separators)
  - original_price: strikethrough price if present, else null
  - manufacturer: brand name
  - dosage_form: tablet/capsule/syrup/cream/other
  - pack_size: units per package, default 1
  - in_stock: true unless "Het hang" badge shown
  - product_url: full product page URL

Return ONLY a valid JSON array, no other text.
If extraction fails, return: {{"error": "EXTRACTION_FAILED", "reason": "description"}}""",
    },
    "an_khang": {
        "name": "An Khang",
        "search_url": "https://www.ankhang.vn/search?q={query}",
        "goal": """You are on ankhang.vn search results for '{query}'.

Step 1: Close any popup or cookie banner by clicking X or "Dong y".
Step 2: Wait for product listings to load completely.
Step 3: If a CAPTCHA appears, STOP and return: {{"error": "CAPTCHA_DETECTED"}}
Step 4: If no results found or "Khong tim thay" message shown, return []
Step 5: Extract ALL product entries:
  - product_name: full name with dosage
  - price: VND integer (remove dot separators)
  - original_price: old price if on sale, else null
  - manufacturer: brand name
  - dosage_form: tablet/capsule/syrup/cream/other
  - pack_size: units per package, default 1
  - in_stock: true unless "Het hang" shown. If "Lien he de biet gia", set price to null and in_stock to false.
  - product_url: full product page URL

Return ONLY a valid JSON array.
If extraction fails, return: {{"error": "EXTRACTION_FAILED", "reason": "description"}}""",
    },
    "than_thien": {
        "name": "Nha Thuoc Than Thien",
        "search_url": "https://nhathuocthanhtien.vn/?s={query}",
        "goal": """You are on nhathuocthanhtien.vn search results for '{query}'.

Step 1: Dismiss any popup or cookie banner.
Step 2: Wait for search results to load.
Step 3: If a CAPTCHA appears, STOP and return: {{"error": "CAPTCHA_DETECTED"}}
Step 4: If no results or "Khong tim thay" message, return []
Step 5: Extract ALL product entries:
  - product_name, price (VND integer, remove dots), original_price (or null),
    manufacturer, dosage_form, pack_size (default 1), in_stock (false if "Het hang"),
    product_url (full URL)

Return ONLY a valid JSON array.
If extraction fails, return: {{"error": "EXTRACTION_FAILED", "reason": "description"}}""",
    },
    "medicare": {
        "name": "Medicare Vietnam",
        "search_url": "https://medicare.vn/search?q={query}",
        "goal": """You are on medicare.vn search results for '{query}'.

Step 1: Dismiss any popup or cookie banner.
Step 2: Wait for search results to load.
Step 3: If a CAPTCHA appears, STOP and return: {{"error": "CAPTCHA_DETECTED"}}
Step 4: If no results or empty page, return []
Step 5: Extract ALL product entries:
  - product_name, price (VND integer, remove dots), original_price (or null),
    manufacturer, dosage_form, pack_size (default 1), in_stock (false if "Het hang" or "Lien he"),
    product_url (full URL)

Return ONLY a valid JSON array.
If extraction fails, return: {{"error": "EXTRACTION_FAILED", "reason": "description"}}""",
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


def _validate_tinyfish_result(event: dict, source_id: str) -> tuple[str, str]:
    """Validate a TinyFish COMPLETE event. Returns (status, data_or_error).

    COMPLETED means the browser session ended, NOT that data was extracted.
    This function checks the actual result content for goal-level failures.
    """
    status = event.get("status", "")

    if status == "FAILED":
        error_msg = event.get("error", {})
        if isinstance(error_msg, dict):
            error_msg = error_msg.get("message", "Infrastructure failure")
        return ("infra_failed", str(error_msg))

    # Get result data
    result_data = event.get("result_json", event.get("result", ""))

    # Parse if string
    parsed = result_data
    if isinstance(result_data, str) and result_data.strip():
        try:
            parsed = json.loads(result_data)
        except json.JSONDecodeError:
            pass

    # Check for structured error responses from our goal prompts
    if isinstance(parsed, dict):
        if parsed.get("error") == "CAPTCHA_DETECTED":
            return ("captcha", f"CAPTCHA detected on {source_id}")
        if parsed.get("error") == "EXTRACTION_FAILED":
            return ("goal_failed", parsed.get("reason", "Extraction failed"))
        if parsed.get("success") is False:
            return ("goal_failed", parsed.get("reason", "Goal not achieved"))

    return ("success", result_data)


AGENT_TIMEOUT = 15.0  # seconds for mock mode
MAX_RETRIES = 3
RETRY_DELAYS = [1.0, 3.0, 5.0]  # exponential-ish backoff
# VND price bounds for sanity checking
MIN_PRICE_VND = 1_000
MAX_PRICE_VND = 50_000_000


async def search_single_pharmacy_safe(source_id: str, query: str, api_key: str, timeout: float = 15.0) -> PharmacySearchResult:
    """Timeout-isolated wrapper with retry logic around search_single_pharmacy."""
    config = PHARMACY_CONFIGS.get(source_id)
    name = config["name"] if config else "Unknown"
    effective_timeout = 180.0 if api_key else timeout
    last_error = None

    for attempt in range(MAX_RETRIES):
        start_time = time.time()
        try:
            result = await asyncio.wait_for(
                search_single_pharmacy(source_id, query, api_key),
                timeout=effective_timeout,
            )
            if result.status == "success":
                return result
            # Non-success but not an exception — don't retry (e.g., no results found)
            return result
        except asyncio.TimeoutError:
            elapsed = int((time.time() - start_time) * 1000)
            last_error = f"Timeout after {effective_timeout}s"
            logger.warning(f"Agent timeout for {source_id} (attempt {attempt + 1}/{MAX_RETRIES})")
        except Exception as e:
            elapsed = int((time.time() - start_time) * 1000)
            last_error = str(e)
            logger.error(f"Agent error for {source_id} (attempt {attempt + 1}/{MAX_RETRIES}): {e}")

        # Retry delay (skip on last attempt)
        if attempt < MAX_RETRIES - 1:
            delay = RETRY_DELAYS[attempt]
            logger.info(f"Retrying {source_id} in {delay}s...")
            await asyncio.sleep(delay)

    elapsed = int((time.time() - start_time) * 1000)
    return PharmacySearchResult(
        source_id=source_id,
        source_name=name,
        status="error",
        error=f"Failed after {MAX_RETRIES} attempts: {last_error}",
        response_time_ms=elapsed,
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
        request_body = {"goal": goal, "url": url, "browser_profile": "stealth"}
        # Add BrightData proxy for high-traffic chains likely to block scrapers
        if source_id in ("long_chau", "pharmacity", "an_khang") and app_settings.brightdata_proxy_url:
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
                streaming_url = None
                run_id = None
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
                        event_type = event.get("type", "")

                        if event_type == "STARTED":
                            run_id = event.get("run_id")
                            logger.info(f"TinyFish run started for {source_id}: {run_id}")
                        elif event_type == "STREAMING_URL":
                            streaming_url = event.get("streaming_url")
                            logger.info(f"TinyFish streaming URL for {source_id}: {streaming_url}")
                        elif event_type == "PROGRESS":
                            logger.debug(f"TinyFish progress [{source_id}]: {event.get('purpose', '')}")
                        elif event_type == "HEARTBEAT":
                            pass
                        elif event_type == "COMPLETE":
                            # Validate: COMPLETED != success
                            run_status, result_data = _validate_tinyfish_result(event, source_id)
                            if run_status != "success":
                                logger.warning(f"TinyFish goal failed for {source_id}: {run_status} - {result_data}")
                                elapsed = int((time.time() - start_time) * 1000)
                                return PharmacySearchResult(
                                    source_id=source_id,
                                    source_name=config["name"],
                                    status="error",
                                    error=f"{run_status}: {result_data}",
                                    response_time_ms=elapsed,
                                    streaming_url=streaming_url,
                                )
                            output_text = result_data
                        else:
                            # Fallback for untyped events (backward compat)
                            for key in ("result", "output", "data", "content", "text", "message"):
                                if key in event and event[key]:
                                    output_text = event[key]
                    except json.JSONDecodeError:
                        # Raw text - might be the result itself
                        if "[" in data or "{" in data:
                            output_text = data

            if not output_text:
                output_text = "[]"

        products_data = _extract_json_array(output_text, source_id)

        products = []
        for p in products_data:
            try:
                product_name = p.get("product_name", "Unknown")
                # Filter out irrelevant results using fuzzy matching
                if fuzzy_match_score(query, product_name) < 0.2:
                    logger.debug(f"Filtered low-relevance product: {product_name}")
                    continue
                price = int(str(p.get("price", 0)).replace(".", "").replace(",", ""))
                if price < MIN_PRICE_VND or price > MAX_PRICE_VND:
                    logger.warning(f"Price {price} VND out of range for {product_name}, skipping")
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
                logger.warning(f"Skipping product parse error for {source_id}: {e} | raw: {p}")

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
            streaming_url=streaming_url,
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
            streaming_url=locals().get("streaming_url"),
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


def _build_batch_runs(
    drugs: list[str], sources: list[str] | None = None
) -> tuple[list[dict], dict[int, tuple[str, str]], dict[str, dict[str, PharmacySearchResult]]]:
    """Build run payloads for /run-batch. Returns (runs, index_mapping, cached_results).

    Skips cached drug+source combinations. index_mapping maps run index -> (drug, source_id).
    """
    target_sources = sources or list(PHARMACY_CONFIGS.keys())
    runs = []
    index_mapping: dict[int, tuple[str, str]] = {}
    cached_results: dict[str, dict[str, PharmacySearchResult]] = {}

    for drug in drugs:
        cached_results.setdefault(drug, {})
        for source_id in target_sources:
            # Check cache first
            cached = _get_cached(drug, source_id)
            if cached is not None:
                cached_results[drug][source_id] = cached
                continue

            config = PHARMACY_CONFIGS.get(source_id)
            if not config:
                continue

            url = config["search_url"].format(query=drug)
            goal = config["goal"].format(query=drug)

            run_payload: dict = {
                "url": url,
                "goal": goal,
                "browser_profile": "stealth",
            }
            if source_id in ("long_chau", "pharmacity", "an_khang") and app_settings.brightdata_proxy_url:
                run_payload["proxy-config"] = {
                    "enabled": True,
                    "url": app_settings.brightdata_proxy_url,
                }

            index_mapping[len(runs)] = (drug, source_id)
            runs.append(run_payload)

    return runs, index_mapping, cached_results


async def _poll_run_result(run_id: str, api_key: str, timeout: float = 180.0) -> dict:
    """Poll a TinyFish run until COMPLETED/FAILED or timeout."""
    deadline = time.time() + timeout
    async with httpx.AsyncClient(timeout=30.0) as client:
        while time.time() < deadline:
            resp = await client.get(
                f"{TINYFISH_RUN_URL}/{run_id}",
                headers={"X-API-Key": api_key},
            )
            resp.raise_for_status()
            data = resp.json()
            status = data.get("status", "")
            if status in ("COMPLETED", "FAILED"):
                return data
            await asyncio.sleep(3.0)
    return {"status": "FAILED", "error": {"message": f"Polling timeout after {timeout}s"}}


def _parse_polled_result(
    run_data: dict, source_id: str, query: str, start_time: float
) -> PharmacySearchResult:
    """Parse a polled run result into PharmacySearchResult. Reuses existing parsing logic."""
    config = PHARMACY_CONFIGS.get(source_id, {})
    name = config.get("name", "Unknown")

    # Validate result (COMPLETED != success)
    run_status, result_data = _validate_tinyfish_result(run_data, source_id)
    if run_status != "success":
        elapsed = int((time.time() - start_time) * 1000)
        return PharmacySearchResult(
            source_id=source_id,
            source_name=name,
            status="error",
            error=f"{run_status}: {result_data}",
            response_time_ms=elapsed,
            streaming_url=run_data.get("streaming_url"),
        )

    products_data = _extract_json_array(result_data, source_id)

    products = []
    for p in products_data:
        try:
            product_name = p.get("product_name", "Unknown")
            if fuzzy_match_score(query, product_name) < 0.2:
                continue
            price = int(str(p.get("price", 0)).replace(".", "").replace(",", ""))
            if price < MIN_PRICE_VND or price > MAX_PRICE_VND:
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
            logger.warning(f"Skipping product parse error for {source_id}: {e}")

    elapsed = int((time.time() - start_time) * 1000)
    lowest = min((p.price for p in products), default=None)
    result = PharmacySearchResult(
        source_id=source_id,
        source_name=name,
        status="success",
        products=products,
        lowest_price=lowest,
        result_count=len(products),
        response_time_ms=elapsed,
        streaming_url=run_data.get("streaming_url"),
    )
    _set_cached(query, source_id, result)
    return result


async def search_all_pharmacies_batch(
    drugs: list[str], api_key: str, sources: list[str] | None = None
) -> dict[str, dict[str, PharmacySearchResult]]:
    """Search multiple drugs across all pharmacies using /run-batch.

    Returns {drug: {source_id: PharmacySearchResult}}.
    """
    runs, index_mapping, results = _build_batch_runs(drugs, sources)

    if not runs:
        # Everything was cached
        return results

    start_time = time.time()

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                TINYFISH_BATCH_URL,
                json={"runs": runs},
                headers={
                    "X-API-Key": api_key,
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            batch_data = resp.json()
            run_ids = batch_data.get("run_ids", [])

        logger.info(f"Batch submitted {len(run_ids)} runs for {len(drugs)} drugs")

        # Poll all runs in parallel
        poll_tasks = [_poll_run_result(rid, api_key) for rid in run_ids]
        poll_results = await asyncio.gather(*poll_tasks, return_exceptions=True)

        # Map results back
        for idx, poll_result in enumerate(poll_results):
            if idx not in index_mapping:
                continue
            drug, source_id = index_mapping[idx]
            results.setdefault(drug, {})

            if isinstance(poll_result, Exception):
                results[drug][source_id] = PharmacySearchResult(
                    source_id=source_id,
                    source_name=PHARMACY_CONFIGS.get(source_id, {}).get("name", "Unknown"),
                    status="error",
                    error=str(poll_result),
                    response_time_ms=int((time.time() - start_time) * 1000),
                )
            else:
                results[drug][source_id] = _parse_polled_result(
                    poll_result, source_id, drug, start_time
                )

    except Exception as e:
        logger.error(f"Batch submission failed: {e}")
        # Fallback: fill missing results with errors
        for idx, (drug, source_id) in index_mapping.items():
            results.setdefault(drug, {})
            if source_id not in results[drug]:
                results[drug][source_id] = PharmacySearchResult(
                    source_id=source_id,
                    source_name=PHARMACY_CONFIGS.get(source_id, {}).get("name", "Unknown"),
                    status="error",
                    error=f"Batch failed: {e}",
                )

    return results
