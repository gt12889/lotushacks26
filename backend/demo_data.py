"""Demo mode data and handlers for MegalodonMD.

All mock data for the 3 demo drugs (Metformin, Paracetamol, Amoxicillin)
plus handler functions that return FastAPI responses for demo mode requests.
Unknown drugs return None to fall through to real APIs.
"""
import asyncio
import json
import time
import random
from pathlib import Path
from datetime import datetime, timedelta
from urllib.parse import unquote

from fastapi import Request
from fastapi.responses import JSONResponse, StreamingResponse, Response


# ---------------------------------------------------------------------------
# DRUG DATA
# ---------------------------------------------------------------------------

DRUG_DATA = {
    "metformin 500mg": {
        "pharmacies": {
            "long_chau": {"name": "Long Chau", "price": 45000, "in_stock": True, "product_name": "Metformin Stada 500mg", "pack_size": "Hop 30 vien", "manufacturer": "Stada", "response_time_ms": 2100},
            "pharmacity": {"name": "Pharmacity", "price": 89000, "in_stock": True, "product_name": "Metformin 500mg", "pack_size": "Hop 30 vien", "manufacturer": "DHG Pharma", "response_time_ms": 6200},
            "an_khang": {"name": "An Khang", "price": 52000, "in_stock": True, "product_name": "Metformin HCl 500mg", "pack_size": "Hop 30 vien", "manufacturer": "Imexpharm", "response_time_ms": 3800},
            "than_thien": {"name": "Than Thien", "price": 135000, "in_stock": True, "product_name": "Metformin STADA 500mg", "pack_size": "Hop 60 vien", "manufacturer": "Stada", "response_time_ms": 7600},
            "medicare": {"name": "Medicare", "price": 67000, "in_stock": False, "product_name": "Metformin 500mg", "pack_size": "Hop 30 vien", "manufacturer": "US Pharma", "response_time_ms": 4600},
        },
        "who_reference": {"price_snippet": "12,000 VND per unit (WHO Essential Medicines)", "source_title": "WHO Model List of Essential Medicines", "source_url": "https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02"},
        "gov_ceiling": 120000,
        "variants": ["Glucophage XR 500mg", "Metformin Stada 500mg"],
        "fluctuations": ["Long Chau: 48,000 -> 45,000 VND (-6.3%)", "Pharmacity: 85,000 -> 89,000 VND (+4.7%)"],
        "analyst_verdict": {
            "type": "analyst_verdict",
            "confidence_score": 82,
            "risk_level": "safe",
            "action_label": "Mua tai Long Chau. Gia tot nhat, dang tin cay.",
            "action_label_en": "Buy at Long Chau. Best price, reliable source.",
            "reasoning": "Long Chau offers the lowest verified price with consistent stock. No anomalies detected across 5 sources. 3 variants discovered and cross-validated.",
            "buy_recommendation": True,
        },
    },
    "paracetamol 500mg": {
        "pharmacies": {
            "long_chau": {"name": "Long Chau", "price": 15000, "in_stock": True, "product_name": "Paracetamol Stada 500mg", "pack_size": "Hop 20 vien", "manufacturer": "Stada", "response_time_ms": 1800},
            "pharmacity": {"name": "Pharmacity", "price": 22000, "in_stock": True, "product_name": "Paracetamol 500mg", "pack_size": "Hop 20 vien", "manufacturer": "DHG Pharma", "response_time_ms": 5400},
            "an_khang": {"name": "An Khang", "price": 18000, "in_stock": True, "product_name": "Paracetamol HCl 500mg", "pack_size": "Hop 20 vien", "manufacturer": "Imexpharm", "response_time_ms": 3200},
            "than_thien": {"name": "Than Thien", "price": 35000, "in_stock": True, "product_name": "Paracetamol STADA 500mg", "pack_size": "Hop 40 vien", "manufacturer": "Stada", "response_time_ms": 7100},
            "medicare": {"name": "Medicare", "price": 19000, "in_stock": True, "product_name": "Paracetamol 500mg", "pack_size": "Hop 20 vien", "manufacturer": "US Pharma", "response_time_ms": 4200},
        },
        "who_reference": {"price_snippet": "5,000 VND per unit (WHO Essential Medicines)", "source_title": "WHO Model List of Essential Medicines", "source_url": "https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02"},
        "gov_ceiling": 50000,
        "variants": ["Panadol Extra 500mg", "Efferalgan 500mg"],
        "fluctuations": ["Long Chau: 16,000 -> 15,000 VND (-6.3%)", "Than Thien: 32,000 -> 35,000 VND (+9.4%)"],
        "analyst_verdict": {
            "type": "analyst_verdict",
            "confidence_score": 91,
            "risk_level": "safe",
            "action_label": "Mua tai Long Chau. Gia re nhat.",
            "action_label_en": "Buy at Long Chau. Cheapest option.",
            "reasoning": "All sources show reasonable pricing. Long Chau is cheapest at 15,000 VND.",
            "buy_recommendation": True,
        },
    },
    "amoxicillin 500mg": {
        "pharmacies": {
            "long_chau": {"name": "Long Chau", "price": 28000, "in_stock": True, "product_name": "Amoxicillin Domesco 500mg", "pack_size": "Hop 21 vien", "manufacturer": "Domesco", "response_time_ms": 2300},
            "pharmacity": {"name": "Pharmacity", "price": 32000, "in_stock": True, "product_name": "Amoxicillin 500mg", "pack_size": "Hop 21 vien", "manufacturer": "DHG Pharma", "response_time_ms": 5800},
            "an_khang": {"name": "An Khang", "price": 8000, "in_stock": True, "product_name": "Amoxicillin 500mg", "pack_size": "Hop 10 vien", "manufacturer": "Unknown", "response_time_ms": 3500},
            "than_thien": {"name": "Than Thien", "price": 35000, "in_stock": True, "product_name": "Amoxicillin STADA 500mg", "pack_size": "Hop 21 vien", "manufacturer": "Stada", "response_time_ms": 7300},
            "medicare": {"name": "Medicare", "price": 25000, "in_stock": True, "product_name": "Amoxicillin 500mg", "pack_size": "Hop 21 vien", "manufacturer": "US Pharma", "response_time_ms": 4400},
        },
        "who_reference": {"price_snippet": "10,000 VND per unit (WHO Essential Medicines)", "source_title": "WHO Model List of Essential Medicines", "source_url": "https://www.who.int/publications/i/item/WHO-MHP-HPS-EML-2023.02"},
        "gov_ceiling": 40000,
        "variants": ["Amoxicillin Trihydrate 500mg", "Augmentin 500mg"],
        "fluctuations": ["An Khang: 12,000 -> 8,000 VND (-33.3%) ANOMALY", "Long Chau: 27,000 -> 28,000 VND (+3.7%)"],
        "anomaly": True,
        "counterfeit_risk": {
            "type": "counterfeit_risk",
            "risk_level": "high",
            "flagged_source": "an_khang",
            "flagged_price": 8000,
            "mean_price": 25600,
            "z_score": -3.2,
            "report": {
                "incidents": [
                    "2025-11: Vietnam MOH recalled 2 batches of substandard Amoxicillin from unlicensed distributor in HCMC",
                    "2025-08: WHO alert on counterfeit antibiotics found in Southeast Asian markets",
                    "2024-12: An Khang supplier audit revealed gaps in cold-chain documentation for certain antibiotic SKUs",
                ],
                "recommendation": "Avoid An Khang for this product. Price is 69% below market average. Purchase from Long Chau or Medicare instead.",
            },
        },
        "analyst_verdict": {
            "type": "analyst_verdict",
            "confidence_score": 54,
            "risk_level": "warning",
            "action_label": "Can than! Gia tai An Khang thap bat thuong.",
            "action_label_en": "Caution! An Khang price is suspiciously low.",
            "reasoning": "An Khang price (8,000 VND) is 69% below the 4-source mean (25,600 VND). This triggers a counterfeit risk investigation. Recommend purchasing from Long Chau (28,000 VND) instead.",
            "buy_recommendation": False,
        },
    },
}


# ---------------------------------------------------------------------------
# OPTIMIZATION DATA
# ---------------------------------------------------------------------------

OPTIMIZE_DATA = {
    "drugs": [
        {"name": "Metformin 500mg", "best_source": "Long Chau", "best_price": 45000, "worst_price": 135000},
        {"name": "Amlodipine 5mg", "best_source": "An Khang", "best_price": 38000, "worst_price": 72000},
        {"name": "Losartan 50mg", "best_source": "Long Chau", "best_price": 55000, "worst_price": 98000},
    ],
    "total_optimized": 138000,
    "best_single_source": {"name": "Pharmacity", "total": 248000},
    "savings_vnd": 110000,
    "savings_pct": 44.4,
}


# ---------------------------------------------------------------------------
# PRESCRIPTION OCR DATA
# ---------------------------------------------------------------------------

PRESCRIPTION_OCR = {
    "drugs": [
        {"name": "Metformin 500mg", "dosage": "500mg", "frequency": "2x daily", "quantity": 60},
        {"name": "Amlodipine 5mg", "dosage": "5mg", "frequency": "1x daily", "quantity": 30},
        {"name": "Losartan 50mg", "dosage": "50mg", "frequency": "1x daily", "quantity": 30},
    ]
}


# ---------------------------------------------------------------------------
# DEMO STATS
# ---------------------------------------------------------------------------

DEMO_STATS = {
    "prices_tracked": 1247,
    "anomalies_detected": 34,
    "violations_flagged": 7,
    "total_savings_vnd": 4200000,
    "drugs_monitored": 23,
    "pharmacies_scanned": 5,
    "total_products": 156,
    "total_scans": 1247,
    "pharmacies_covered": 5,
    "drugs_tracked": 23,
    "avg_scan_time_ms": 4200,
}


# ---------------------------------------------------------------------------
# DEMO ALERTS & MONITORS
# ---------------------------------------------------------------------------

DEMO_ALERTS = [
    {"id": 1, "drug_query": "Metformin 500mg", "price_threshold": 50000, "is_active": True, "created_at": "2026-03-20T10:30:00"},
    {"id": 2, "drug_query": "Amoxicillin 500mg", "price_threshold": 30000, "is_active": True, "created_at": "2026-03-19T14:15:00"},
    {"id": 3, "drug_query": "Paracetamol 500mg", "price_threshold": 20000, "is_active": True, "created_at": "2026-03-18T09:00:00"},
]

DEMO_MONITORS = [
    {"id": 1, "drug_query": "Metformin 500mg", "interval_minutes": 60, "sources": "all", "is_active": True, "last_run_at": "2026-03-21T08:00:00"},
    {"id": 2, "drug_query": "Losartan 50mg", "interval_minutes": 120, "sources": "all", "is_active": True, "last_run_at": "2026-03-21T06:00:00"},
]


# ---------------------------------------------------------------------------
# HELPER
# ---------------------------------------------------------------------------

def _find_drug(query: str):
    """Find drug data by fuzzy matching."""
    q = query.lower().strip()
    for key, data in DRUG_DATA.items():
        if key in q or q in key:
            return key, data
    return None, None


# ---------------------------------------------------------------------------
# HANDLERS
# ---------------------------------------------------------------------------

async def demo_search(request: Request):
    """SSE streaming search with staggered pharmacy results."""
    query = request.query_params.get("query", "")
    drug_key, drug = _find_drug(query)
    if not drug:
        return None  # fall through to real API

    async def event_generator():
        pharmacies = drug["pharmacies"]

        # Tier 0: Normalization
        await asyncio.sleep(0.5)
        yield f"data: {json.dumps({'type': 'model_used', 'step': 'normalize', 'model': 'qwen/qwen-2.5-72b-instruct', 'provider': 'OpenRouter', 'latency_ms': 340, 'original_query': query, 'normalized_query': drug_key.title()}, ensure_ascii=False)}\n\n"

        # Tier 1: Pharmacy searches - emit searching status for all
        for sid, pdata in pharmacies.items():
            yield f"data: {json.dumps({'type': 'pharmacy_status', 'source_id': sid, 'source_name': pdata['name'], 'status': 'searching', 'products': [], 'lowest_price': None, 'result_count': 0, 'response_time_ms': None, 'error': None}, ensure_ascii=False)}\n\n"

        for sid, pdata in pharmacies.items():
            agent_name = pdata["name"] + " Agent"
            spawn_evt = {"type": "agent_spawn", "name": agent_name, "target": pdata["name"], "tier": "SEARCH"}
            yield f"data: {json.dumps(spawn_evt, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.2)

        # Stagger pharmacy completions
        delays = [2.0, 3.5, 4.5, 6.0, 7.5]
        start = time.time()
        sorted_pharmacies = list(pharmacies.items())

        for i, (sid, pdata) in enumerate(sorted_pharmacies):
            elapsed = time.time() - start
            remaining = delays[i] - elapsed
            if remaining > 0:
                await asyncio.sleep(remaining)

            products = [{
                "product_name": pdata["product_name"],
                "price": pdata["price"],
                "original_price": int(pdata["price"] * 1.1) if random.random() > 0.5 else None,
                "pack_size": pdata["pack_size"],
                "unit_price": pdata["price"],
                "manufacturer": pdata["manufacturer"],
                "in_stock": pdata["in_stock"],
                "product_url": f"https://{sid.replace('_', '')}.vn/product/{drug_key.replace(' ', '-')}",
            }]

            stream_url = f"https://tf-demo.tinyfish.app/stream/{i}"
            url_evt = {"type": "streaming_url", "source_id": sid, "streaming_url": stream_url}
            yield f"data: {json.dumps(url_evt, ensure_ascii=False)}\n\n"

            result_evt = {"source_id": sid, "source_name": pdata["name"], "status": "success", "products": products, "lowest_price": pdata["price"], "result_count": 1, "response_time_ms": pdata["response_time_ms"], "error": None}
            yield f"data: {json.dumps(result_evt, ensure_ascii=False)}\n\n"

            complete_agent_name = pdata["name"] + " Agent"
            complete_evt = {"type": "agent_complete", "agent_id": complete_agent_name, "result_count": 1}
            yield f"data: {json.dumps(complete_evt, ensure_ascii=False)}\n\n"

        # Tier 2: Variant discovery
        await asyncio.sleep(1.0)
        yield f"data: {json.dumps({'type': 'agent_spawn', 'name': 'Exa Variant Scout', 'target': drug_key.title(), 'tier': 'VARIANT'}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps({'type': 'model_used', 'step': 'discovery', 'model': 'exa-neural', 'provider': 'Exa', 'latency_ms': 890}, ensure_ascii=False)}\n\n"

        # Tier 3: Scout spawns for variants
        for v in drug.get("variants", []):
            await asyncio.sleep(0.3)
            scout_name = f"Scout: {v}"
            scout_spawn = {"type": "agent_spawn", "name": scout_name, "target": v, "tier": "SCOUT"}
            yield f"data: {json.dumps(scout_spawn, ensure_ascii=False)}\n\n"
            await asyncio.sleep(0.5)
            scout_done = {"type": "agent_complete", "agent_id": scout_name, "result_count": 2}
            yield f"data: {json.dumps(scout_done, ensure_ascii=False)}\n\n"

        # Tier 4: Analyst verdict
        await asyncio.sleep(1.5)
        yield f"data: {json.dumps({'type': 'model_used', 'step': 'analyst', 'model': 'qwen/qwen-2.5-72b-instruct', 'provider': 'OpenRouter', 'latency_ms': 2100}, ensure_ascii=False)}\n\n"
        yield f"data: {json.dumps(drug['analyst_verdict'], ensure_ascii=False)}\n\n"

        # Tier 5: Investigation (for anomaly drugs)
        if drug.get("anomaly") and drug.get("counterfeit_risk"):
            await asyncio.sleep(0.5)
            yield f"data: {json.dumps({'type': 'anomaly_investigation', 'product_name': 'Amoxicillin 500mg', 'source_id': 'an_khang', 'price': 8000, 'manufacturer_check': {'known_good': False, 'reason': 'Unknown manufacturer not in DAV registry'}}, ensure_ascii=False)}\n\n"
            yield f"data: {json.dumps(drug['counterfeit_risk'], ensure_ascii=False)}\n\n"

        # Final summary
        prices = [p["price"] for p in pharmacies.values()]
        best_price = min(prices)
        worst_price = max(prices)
        best_source_id = min(pharmacies, key=lambda k: pharmacies[k]["price"])
        best_source_name = pharmacies[best_source_id]["name"]

        compliance = None
        if drug.get("gov_ceiling"):
            violations = [
                {"source_id": sid, "source_name": p["name"], "price": p["price"], "ceiling": drug["gov_ceiling"]}
                for sid, p in pharmacies.items() if p["price"] > drug["gov_ceiling"]
            ]
            compliance = {
                "ceiling_price": drug["gov_ceiling"],
                "source": "dav.gov.vn",
                "violations": violations,
            }

        who_ref = drug.get("who_reference")

        summary = {
            "type": "search_complete",
            "task": "summary",
            "query": drug_key.title(),
            "best_price": best_price,
            "best_source": best_source_name,
            "price_range": f"{best_price:,} - {worst_price:,} VND".replace(",", "."),
            "potential_savings": worst_price - best_price,
            "total_results": len(pharmacies),
            "variants": drug.get("variants", []),
            "price_fluctuations": drug.get("fluctuations", []),
            "who_reference": who_ref,
            "compliance": compliance,
            "confidence_scoring": {
                "signals": [
                    {"name": "source_agreement", "score": 25, "max": 30},
                    {"name": "price_convergence", "score": 15, "max": 20},
                    {"name": "compliance", "score": 12, "max": 15},
                    {"name": "anomaly_free", "score": 15 if not drug.get("anomaly") else 5, "max": 20},
                    {"name": "variant_coverage", "score": 12, "max": 15},
                ],
            },
        }
        yield f"data: {json.dumps(summary, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


async def demo_tts_summary(request: Request):
    """Return cached demo audio if available."""
    body = await request.json()
    query = body.get("query", "metformin").lower()

    for key in ["metformin", "paracetamol", "amoxicillin"]:
        if key in query:
            audio_path = Path(__file__).parent / "static" / "demo_audio" / f"summary_{key}.mp3"
            if audio_path.exists():
                return Response(
                    content=audio_path.read_bytes(),
                    media_type="audio/mpeg",
                    headers={"Content-Disposition": "inline", "X-TTS-Text": f"Demo audio for {key}"},
                )

    return Response(status_code=503, content="Demo audio not available")


async def demo_optimize(request: Request):
    """Return optimization results for a drug list."""
    body = await request.json()

    results = []
    for d in OPTIMIZE_DATA["drugs"]:
        results.append({
            "drug": d["name"],
            "best_source": d["best_source"],
            "best_price": d["best_price"],
            "worst_price": d["worst_price"],
            "all_prices": {
                "Long Chau": d["best_price"] + random.randint(0, 5000),
                "Pharmacity": d["worst_price"] - random.randint(0, 5000),
                "An Khang": d["best_price"] + random.randint(5000, 15000),
            },
        })

    return JSONResponse({
        "drugs": results,
        "total_optimized": OPTIMIZE_DATA["total_optimized"],
        "best_single_source": OPTIMIZE_DATA["best_single_source"],
        "savings_vnd": OPTIMIZE_DATA["savings_vnd"],
        "savings_pct": OPTIMIZE_DATA["savings_pct"],
    })


async def demo_optimize_stream(request: Request):
    """SSE streaming optimization results."""
    body = await request.json()

    async def event_generator():
        yield f"data: {json.dumps({'type': 'optimize_start', 'drug_count': len(OPTIMIZE_DATA['drugs'])})}\n\n"

        for i, d in enumerate(OPTIMIZE_DATA["drugs"]):
            yield f"data: {json.dumps({'type': 'drug_started', 'drug': d['name'], 'index': i})}\n\n"
            await asyncio.sleep(1.5 + random.random())
            yield f"data: {json.dumps({'type': 'drug_complete', 'drug': d['name'], 'best_source': d['best_source'], 'best_price': d['best_price'], 'index': i})}\n\n"

        yield f"data: {json.dumps({'type': 'optimize_complete', 'total_optimized': OPTIMIZE_DATA['total_optimized'], 'best_single_source': OPTIMIZE_DATA['best_single_source'], 'savings_vnd': OPTIMIZE_DATA['savings_vnd'], 'savings_pct': OPTIMIZE_DATA['savings_pct']})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


async def demo_optimize_prescription(request: Request):
    """Simulate OCR prescription parsing."""
    await asyncio.sleep(2.0)
    return JSONResponse({
        "drugs": PRESCRIPTION_OCR["drugs"],
        "model_used": {"step": "ocr", "model": "openai/gpt-4o", "provider": "OpenAI", "latency_ms": 1850},
    })


async def demo_nl_search(request: Request):
    """Natural language search with streaming results."""
    query = request.query_params.get("query", "diabetes and blood pressure medications")

    async def event_generator():
        drugs = ["Metformin 500mg", "Amlodipine 5mg", "Losartan 50mg"]

        yield f"data: {json.dumps({'type': 'nl_parsed', 'drugs': drugs, 'preferences': {}, 'summary': f'Parsed: {query}', 'latency_ms': 680})}\n\n"
        yield f"data: {json.dumps({'type': 'model_used', 'step': 'nl_parse', 'model': 'qwen/qwen-2.5-72b-instruct', 'provider': 'OpenRouter', 'latency_ms': 680})}\n\n"

        all_results = {}
        for drug_name in drugs:
            yield f"data: {json.dumps({'type': 'drug_search_started', 'drug': drug_name})}\n\n"
            await asyncio.sleep(1.0 + random.random())

            drug_key, drug_data = _find_drug(drug_name)
            if drug_data:
                best_sid = min(drug_data["pharmacies"], key=lambda k: drug_data["pharmacies"][k]["price"])
                best = drug_data["pharmacies"][best_sid]
                all_results[drug_name] = {
                    "best_price": best["price"],
                    "best_source": best["name"],
                    "total_results": len(drug_data["pharmacies"]),
                }
            else:
                all_results[drug_name] = {"best_price": 50000, "best_source": "Long Chau", "total_results": 5}

            yield f"data: {json.dumps({'type': 'drug_search_complete', 'drug': drug_name, **all_results[drug_name]})}\n\n"

        # Synthesis
        yield f"data: {json.dumps({'type': 'model_used', 'step': 'synthesis', 'model': 'qwen/qwen-2.5-72b-instruct', 'provider': 'OpenRouter', 'latency_ms': 1400})}\n\n"

        synthesis = "For this clinic's needs, source Metformin and Losartan from Long Chau and Amlodipine from An Khang. Total monthly cost: 138,000 VND vs 248,000 VND single-source. Annual savings: 1,320,000 VND."

        yield f"data: {json.dumps({'type': 'nl_complete', 'drugs': drugs, 'results': all_results, 'synthesis': synthesis})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


async def demo_alert(request: Request):
    """Demo alert -- fires REAL Discord webhook with cached audio if available."""
    from routers.demo_alert import DemoAlertRequest
    from config import settings
    from services.discord import send_alert, send_alert_with_audio

    body = await request.json()
    req = DemoAlertRequest(**body)

    # Try cached audio first
    audio = None
    for key in ["metformin", "paracetamol", "amoxicillin"]:
        if key in req.drug_name.lower():
            audio_path = Path(__file__).parent / "static" / "demo_audio" / f"summary_{key}.mp3"
            if audio_path.exists():
                audio = audio_path.read_bytes()
                break

    price_str = f"{req.best_price:,} VND" if req.best_price else "best price available"
    source_str = req.best_source or "multiple pharmacies"
    discord_msg = (
        f"**Price Alert: {req.drug_name}**\n"
        f"Best price: {price_str} at {source_str}\n"
        f"_Scanned across 5 Vietnamese pharmacy chains via TinyFish agents_\n\n"
        f"Vietnamese voice note attached (ElevenLabs)"
    )

    results = {"audio_generated": audio is not None, "discord_sent": False, "call_placed": False, "sponsors": ["ElevenLabs", "Discord"]}

    if settings.discord_webhook_url:
        try:
            if audio:
                await send_alert_with_audio(discord_msg, audio, settings.discord_webhook_url)
            else:
                await send_alert(discord_msg, settings.discord_webhook_url)
            results["discord_sent"] = True
        except Exception:
            pass

    results["status"] = "sent" if results["discord_sent"] else "partial"
    return JSONResponse(results)


async def demo_alerts_list(request: Request):
    """Return list of demo price alerts."""
    return JSONResponse(DEMO_ALERTS)


async def demo_alerts_create(request: Request):
    """Create a new demo alert (returns fake ID)."""
    body = await request.json()
    return JSONResponse({
        "id": random.randint(100, 999),
        "drug_query": body.get("drug_query", "Unknown"),
        "price_threshold": body.get("price_threshold", 50000),
        "is_active": True,
    })


async def demo_trends(request: Request):
    """Generate 30 days of mock price history with random walk."""
    path = request.url.path
    parts = path.split("/api/trends/")
    drug_query = parts[1] if len(parts) > 1 else "Metformin 500mg"
    drug_query = unquote(drug_query)

    drug_key, drug = _find_drug(drug_query)
    if not drug:
        return None

    days = int(request.query_params.get("days", "30"))
    data = []
    now = datetime.utcnow()

    for sid, pdata in drug.get("pharmacies", {}).items():
        base = pdata["price"]
        for d in range(days, 0, -1):
            jitter = random.uniform(-0.08, 0.08)
            price = int(base * (1 + jitter))
            ts = (now - timedelta(days=d)).isoformat() + "Z"
            data.append({
                "source_id": sid,
                "source_name": pdata["name"],
                "product_name": pdata["product_name"],
                "price": price,
                "observed_at": ts,
            })

    return JSONResponse({"data": data})


async def demo_sparklines(request: Request):
    """Generate 7-day sparkline data for a drug."""
    path = request.url.path
    parts = path.split("/api/sparklines/")
    drug_query = parts[1] if len(parts) > 1 else "Metformin 500mg"
    drug_query = unquote(drug_query)

    drug_key, drug = _find_drug(drug_query)
    if not drug:
        return None

    sparklines = {}
    now = datetime.utcnow()

    for sid, pdata in drug.get("pharmacies", {}).items():
        base = pdata["price"]
        points = []
        for d in range(7, 0, -1):
            jitter = random.uniform(-0.05, 0.05)
            points.append({
                "price": int(base * (1 + jitter)),
                "time": (now - timedelta(days=d)).isoformat() + "Z",
            })
        sparklines[sid] = {"source_name": pdata["name"], "points": points}

    return JSONResponse({"sparklines": sparklines})


async def demo_stats(request: Request):
    """Return demo platform statistics."""
    return JSONResponse(DEMO_STATS)


async def demo_insights(request: Request):
    """Return demo shopping insights for a drug."""
    body = await request.json()
    drug = body.get("drug_query", "Metformin 500mg")

    return JSONResponse({
        "enabled": True,
        "insight": f"You've searched {drug} 3 times this week. Price at Long Chau dropped 6.3% since your last search. Good time to buy.",
        "memory_snippets_used": 3,
        "error": None,
    })


async def demo_memory_recall(request: Request):
    """Return demo memory recall snippets."""
    return JSONResponse({
        "enabled": True,
        "snippets": [
            "Last search: Metformin 500mg -- best at Long Chau 45,000 VND (3 hours ago)",
            "Price trend: Metformin prices dropped 6.3% across all sources this week",
            "Alert: Amoxicillin 500mg anomaly detected at An Khang -- flagged for review",
        ],
    })


async def demo_health_services(request: Request):
    """Return healthy status for all external services."""
    now_iso = datetime.utcnow().isoformat()
    return JSONResponse({
        "tinyfish": {"status": "healthy", "latency_ms": 120, "last_check": now_iso},
        "exa": {"status": "healthy", "latency_ms": 85, "last_check": now_iso},
        "openrouter": {"status": "healthy", "latency_ms": 200, "last_check": now_iso},
        "elevenlabs": {"status": "healthy", "latency_ms": 150, "last_check": now_iso},
        "supermemory": {"status": "healthy", "latency_ms": 95, "last_check": now_iso},
    })


async def demo_monitors_list(request: Request):
    """Return list of demo price monitors."""
    return JSONResponse(DEMO_MONITORS)


async def demo_monitors_create(request: Request):
    """Create a new demo monitor (returns fake ID)."""
    body = await request.json()
    return JSONResponse({
        "id": random.randint(100, 999),
        "drug_query": body.get("drug_query", "Unknown"),
        "interval_minutes": body.get("interval_minutes", 60),
        "sources": body.get("sources", "all"),
        "is_active": True,
    })


# ---------------------------------------------------------------------------
# ROUTE MAPPING
# ---------------------------------------------------------------------------

# Exact match: (METHOD, path) -> handler
DEMO_ROUTES = {
    ("POST", "/api/search"): demo_search,
    ("POST", "/api/tts/summary"): demo_tts_summary,
    ("POST", "/api/optimize"): demo_optimize,
    ("POST", "/api/optimize/stream"): demo_optimize_stream,
    ("POST", "/api/optimize/prescription"): demo_optimize_prescription,
    ("POST", "/api/nl-search"): demo_nl_search,
    ("POST", "/api/demo-alert"): demo_alert,
    ("GET", "/api/alerts"): demo_alerts_list,
    ("POST", "/api/alerts"): demo_alerts_create,
    ("POST", "/api/insights"): demo_insights,
    ("GET", "/api/memory/recall"): demo_memory_recall,
    ("GET", "/api/stats"): demo_stats,
    ("GET", "/health/services"): demo_health_services,
    ("GET", "/api/monitors"): demo_monitors_list,
    ("POST", "/api/monitor"): demo_monitors_create,
}

# Prefix match: (METHOD, path_prefix) -> handler
DEMO_PREFIX_ROUTES = {
    ("GET", "/api/trends/"): demo_trends,
    ("GET", "/api/sparklines/"): demo_sparklines,
}
