from pydantic import BaseModel
from enum import Enum
from typing import Optional


class VehicleType(str, Enum):
    motorbike = "motorbike"
    car = "car"
    truck = "truck"


class ViolationRecord(BaseModel):
    date: str
    description: str
    status: str  # "paid", "unpaid"
    fine_amount: float
    location: Optional[str] = None


class SceneAnalysis(BaseModel):
    damage_description: str
    impact_point: str
    road_conditions: str
    vehicle_positions: str
    plate_confirmed: bool


class LegalReference(BaseModel):
    article_number: str
    title: str
    summary: str
    relevance: float  # 0-1 score


class EvidenceReport(BaseModel):
    violation_history: list[ViolationRecord]
    scene_analysis: SceneAnalysis
    legal_references: list[LegalReference]
    fault_assessment: str
    risk_score: float  # 0-100
    next_steps: list[str]
    summary_text: str


class AnalyzeResponse(BaseModel):
    report: EvidenceReport
    pdf_url: Optional[str] = None
    audio_url: Optional[str] = None
