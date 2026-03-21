"""AI Synthesis service - GPT-4o + Qwen for evidence report generation"""
import asyncio
import json
import logging
from openai import AsyncOpenAI
from models.schemas import (
    ViolationRecord, SceneAnalysis, LegalReference, EvidenceReport
)

logger = logging.getLogger(__name__)


async def parse_vietnamese_text(text: str, qwen_api_key: str) -> str:
    """Use Qwen to parse and clean Vietnamese text from government portals."""
    if not qwen_api_key or not text:
        return text

    try:
        client = AsyncOpenAI(
            api_key=qwen_api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        )
        response = await client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {
                    "role": "system",
                    "content": "You are a Vietnamese language expert. Clean and structure the following Vietnamese government portal text. Fix encoding issues, normalize formatting, and return clean readable Vietnamese text.",
                },
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        return response.choices[0].message.content or text
    except Exception as e:
        logger.error(f"Qwen parsing error: {e}")
        return text


async def synthesize_report(
    violations: list[ViolationRecord],
    scene: SceneAnalysis,
    legal_refs: list[LegalReference],
    openai_api_key: str,
    qwen_api_key: str = "",
    description: str = "",
) -> EvidenceReport:
    """Combine all data sources into a coherent evidence report using GPT-4o."""

    # Prepare Vietnamese text for Qwen parsing in parallel with synthesis
    vietnamese_texts = [v.description for v in violations if v.description]
    raw_vn_text = "\n".join(vietnamese_texts)

    # Build the data summary for GPT-4o
    violations_summary = json.dumps(
        [v.model_dump() for v in violations], ensure_ascii=False, indent=2
    )
    scene_summary = json.dumps(scene.model_dump(), ensure_ascii=False, indent=2)
    legal_summary = json.dumps(
        [ref.model_dump() for ref in legal_refs], ensure_ascii=False, indent=2
    )

    system_prompt = """You are a Vietnamese traffic incident analyst. Given violation history, scene analysis, and legal references, produce a structured evidence report.

Your output MUST be valid JSON with these exact fields:
{
    "fault_assessment": "Detailed fault analysis based on all evidence (2-3 paragraphs)",
    "risk_score": <number 0-100 based on violation history severity + scene damage>,
    "next_steps": ["step1", "step2", ...],
    "summary_text": "Vietnamese language summary (Tiếng Việt) of the entire analysis for voice readout"
}

Risk scoring guidelines:
- 0-30: Minor incident, no prior violations, minimal damage
- 30-60: Moderate incident, some violations, clear damage
- 60-80: Serious incident, multiple violations, significant damage
- 80-100: Severe, extensive violation history, major damage or injuries

Be specific and reference actual data from the inputs. The Vietnamese summary should be natural and complete."""

    user_prompt = f"""Analyze this traffic incident:

## Violation History
{violations_summary}

## Scene Analysis
{scene_summary}

## Legal References
{legal_summary}

## Incident Description
{description or 'No additional description provided'}

Generate the evidence report JSON."""

    if not openai_api_key:
        logger.warning("OpenAI API key not configured, returning basic report")
        return EvidenceReport(
            violation_history=violations,
            scene_analysis=scene,
            legal_references=legal_refs,
            fault_assessment="AI synthesis unavailable - API key not configured.",
            risk_score=50.0,
            next_steps=["Configure OpenAI API key for full synthesis"],
            summary_text="Phân tích AI chưa khả dụng. Vui lòng cấu hình API key.",
        )

    try:
        client = AsyncOpenAI(api_key=openai_api_key)

        # Run GPT-4o synthesis and Qwen parsing in parallel
        synthesis_task = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
            response_format={"type": "json_object"},
        )

        qwen_task = parse_vietnamese_text(raw_vn_text, qwen_api_key)

        synthesis_response, parsed_vn = await asyncio.gather(
            synthesis_task, qwen_task, return_exceptions=True
        )

        # Handle synthesis result
        if isinstance(synthesis_response, Exception):
            logger.error(f"GPT-4o synthesis failed: {synthesis_response}")
            raise synthesis_response

        result_text = synthesis_response.choices[0].message.content
        result = json.loads(result_text)

        return EvidenceReport(
            violation_history=violations,
            scene_analysis=scene,
            legal_references=legal_refs,
            fault_assessment=result.get("fault_assessment", "Analysis incomplete"),
            risk_score=float(result.get("risk_score", 50)),
            next_steps=result.get("next_steps", []),
            summary_text=result.get("summary_text", ""),
        )

    except Exception as e:
        logger.error(f"Synthesis error: {e}")
        # Return a basic report on failure
        total_fines = sum(v.fine_amount for v in violations)
        unpaid = sum(1 for v in violations if v.status == "unpaid")
        return EvidenceReport(
            violation_history=violations,
            scene_analysis=scene,
            legal_references=legal_refs,
            fault_assessment=f"Automated analysis: {len(violations)} prior violations found (total fines: {total_fines:,.0f} VND, {unpaid} unpaid). Scene shows {scene.damage_description.lower()}. {len(legal_refs)} relevant legal references identified.",
            risk_score=min(100, len(violations) * 20 + (30 if scene.plate_confirmed else 0)),
            next_steps=[
                "File police report with this evidence package",
                "Contact insurance with PDF export",
                "Pay outstanding violations" if unpaid else "No outstanding fines",
                "Request official accident report",
            ],
            summary_text=f"Phát hiện {len(violations)} vi phạm trước đó. Tổng phạt: {total_fines:,.0f} VND.",
        )
