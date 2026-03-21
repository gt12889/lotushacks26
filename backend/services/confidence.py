"""Cross-validation confidence scoring + Tier 4 Analyst verdict via OpenRouter."""
import json
import logging
import statistics
import httpx
from config import settings as app_settings

logger = logging.getLogger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def compute_confidence(
    results: dict,
    all_products: list,
    compliance_data: dict,
    anomalies: list | None,
    all_variants: list,
    tier3_products: list,
) -> dict:
    """Compute confidence score from cross-validation of all agent signals.

    Returns {"score": int, "signals": [{"signal", "weight", "value", "explanation"}]}
    Pure computation — no API calls.
    """
    signals = []

    # 1. Source agreement (30 pts) — how many pharmacies returned results
    total_sources = len(results)
    successful = sum(1 for r in results.values() if r.status == "success")
    source_score = int((successful / max(total_sources, 1)) * 30)
    signals.append({
        "signal": "source_agreement",
        "weight": 30,
        "value": source_score,
        "explanation": f"{successful}/{total_sources} pharmacies returned results",
    })

    # 2. Price convergence (20 pts) — low std deviation = high agreement
    prices = [p.price for p in all_products if p.price and p.price > 0]
    if len(prices) >= 2:
        mean_price = statistics.mean(prices)
        std_price = statistics.stdev(prices)
        cv = (std_price / mean_price) * 100 if mean_price > 0 else 100
        convergence_score = max(0, min(20, int(20 - cv)))
        signals.append({
            "signal": "price_convergence",
            "weight": 20,
            "value": convergence_score,
            "explanation": f"Price CV={cv:.1f}% across {len(prices)} products",
        })
    else:
        signals.append({
            "signal": "price_convergence",
            "weight": 20,
            "value": 10,
            "explanation": "Insufficient price data for convergence analysis",
        })

    # 3. Compliance clear (15 pts)
    has_ceiling = compliance_data.get("has_ceiling", False)
    violations = compliance_data.get("violations", [])
    if has_ceiling and not violations:
        comp_score = 15
        comp_msg = "Within government ceiling price"
    elif has_ceiling and violations:
        comp_score = 5
        comp_msg = f"{len(violations)} ceiling violations detected"
    else:
        comp_score = 10
        comp_msg = "No government ceiling data available for this drug"
    signals.append({
        "signal": "compliance_clear",
        "weight": 15,
        "value": comp_score,
        "explanation": comp_msg,
    })

    # 4. Anomaly free (20 pts)
    if not anomalies:
        anomaly_score = 20
        anomaly_msg = "No price anomalies detected"
    else:
        anomaly_score = 5
        anomaly_msg = f"{len(anomalies)} suspicious price anomalies flagged"
    signals.append({
        "signal": "anomaly_free",
        "weight": 20,
        "value": anomaly_score,
        "explanation": anomaly_msg,
    })

    # 5. Variant coverage (15 pts)
    if all_variants and len(all_variants) > 0:
        variant_score = 15
        variant_msg = f"{len(all_variants)} generic variants discovered via Exa"
    elif tier3_products:
        variant_score = 12
        variant_msg = "Variant products found via scout-spawn"
    else:
        variant_score = 8
        variant_msg = "No variants found (may be a unique formulation)"
    signals.append({
        "signal": "variant_coverage",
        "weight": 15,
        "value": variant_score,
        "explanation": variant_msg,
    })

    total_score = sum(s["value"] for s in signals)
    return {"score": min(100, total_score), "signals": signals}


def _fallback_verdict(query: str, confidence: dict, summary: dict) -> dict:
    """Rule-based fallback when LLM is unavailable."""
    score = confidence["score"]
    best_source = summary.get("best_source", "")
    best_price = summary.get("best_price", 0)
    savings = summary.get("potential_savings", 0)
    has_anomalies = bool(summary.get("price_anomalies"))
    compliance = summary.get("compliance", {})
    has_violations = bool(compliance.get("violations"))

    if has_violations:
        return {
            "action_label": f"Vượt giá trần chính phủ. Báo cáo Cục Quản lý Dược.",
            "action_label_en": f"Above government ceiling. Report to DAV.",
            "risk_level": "danger",
            "reasoning": "One or more products exceed the government-declared ceiling price.",
            "confidence_score": score,
            "buy_recommendation": False,
        }
    if has_anomalies:
        return {
            "action_label": f"Giá bất thường. Kiểm tra tính xác thực trước khi mua.",
            "action_label_en": f"Suspicious pricing. Verify authenticity before purchasing.",
            "risk_level": "warning",
            "reasoning": "Anomalously low prices detected. May indicate counterfeit or grey-market products.",
            "confidence_score": score,
            "buy_recommendation": False,
        }
    if score >= 75:
        savings_str = f"{int(savings):,}".replace(",", ".") if savings else ""
        return {
            "action_label": f"Mua tại {best_source}. Giá tốt nhất, đáng tin cậy." + (f" Tiết kiệm {savings_str}đ." if savings_str else ""),
            "action_label_en": f"Buy at {best_source}. Best price, verified reliable." + (f" Save {int(savings):,} VND." if savings else ""),
            "risk_level": "safe",
            "reasoning": f"High confidence ({score}%). Multiple sources agree on pricing. No anomalies or compliance issues.",
            "confidence_score": score,
            "buy_recommendation": True,
        }
    return {
        "action_label": f"So sánh thêm trước khi mua. Độ tin cậy trung bình.",
        "action_label_en": f"Compare more sources before buying. Moderate confidence.",
        "risk_level": "caution",
        "reasoning": f"Moderate confidence ({score}%). Limited source agreement or price variance is high.",
        "confidence_score": score,
        "buy_recommendation": False,
    }


async def generate_analyst_verdict(
    query: str, confidence: dict, summary: dict, api_key: str
) -> dict:
    """Tier 4 Analyst: Generate actionable Vietnamese verdict via OpenRouter LLM.

    Falls back to rule-based labels if LLM fails.
    """
    if not api_key:
        return _fallback_verdict(query, confidence, summary)

    system_prompt = """You are a Vietnamese pharmaceutical procurement analyst. Given search results and confidence data, produce an actionable verdict for a procurement manager.

Output ONLY valid JSON with these fields:
- action_label: Vietnamese action directive (1-2 sentences, imperative tone)
- action_label_en: English translation
- risk_level: one of "safe", "caution", "warning", "danger"
- reasoning: 2-3 sentence explanation in English
- confidence_score: passthrough the score provided
- buy_recommendation: boolean

Risk level guide:
- safe: high confidence, no anomalies, within compliance → recommend buying
- caution: moderate confidence or limited data → suggest comparing more
- warning: price anomalies detected → verify authenticity first
- danger: compliance violations → do not buy, report

Keep action_label short and actionable. A stressed procurement manager should know what to do in 3 seconds."""

    user_content = json.dumps({
        "drug_query": query,
        "confidence_score": confidence["score"],
        "confidence_signals": confidence["signals"],
        "best_price": summary.get("best_price"),
        "best_source": summary.get("best_source"),
        "potential_savings": summary.get("potential_savings"),
        "total_results": summary.get("total_results"),
        "sources_successful": len([s for s in confidence["signals"] if s["signal"] == "source_agreement"]),
        "has_anomalies": bool(summary.get("price_anomalies")),
        "has_compliance_violations": bool(summary.get("compliance", {}).get("violations")),
        "variant_count": len(summary.get("variants", [])),
    }, ensure_ascii=False)

    models_to_try = [
        app_settings.openrouter_normalization_model,
        app_settings.openrouter_fallback_model,
    ]

    for model in models_to_try:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    OPENROUTER_API_URL,
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_content},
                        ],
                        "max_tokens": 300,
                        "temperature": 0.1,
                    },
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                )
                if response.status_code != 200:
                    logger.warning(f"Analyst LLM {model} returned {response.status_code}")
                    continue

                content = response.json()["choices"][0]["message"]["content"]

                # Strip markdown fences if present
                clean = content.strip()
                if clean.startswith("```"):
                    lines = clean.split("\n")
                    lines = [l for l in lines[1:] if not l.strip().startswith("```")]
                    clean = "\n".join(lines).strip()

                verdict = json.loads(clean)

                # Validate required fields
                required = ["action_label", "action_label_en", "risk_level", "reasoning"]
                if not all(k in verdict for k in required):
                    logger.warning(f"Analyst LLM missing fields: {verdict.keys()}")
                    continue

                # Ensure risk_level is valid
                if verdict["risk_level"] not in ("safe", "caution", "warning", "danger"):
                    verdict["risk_level"] = "caution"

                verdict["confidence_score"] = confidence["score"]
                if "buy_recommendation" not in verdict:
                    verdict["buy_recommendation"] = verdict["risk_level"] == "safe"

                logger.info(f"Analyst verdict via {model}: {verdict['risk_level']} ({confidence['score']}%)")
                return verdict

        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.warning(f"Analyst LLM {model} parse error: {e}")
            continue
        except Exception as e:
            logger.warning(f"Analyst LLM {model} failed: {e}")
            continue

    logger.warning("All analyst LLM models failed, using fallback")
    return _fallback_verdict(query, confidence, summary)
