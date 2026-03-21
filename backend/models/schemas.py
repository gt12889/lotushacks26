"""Pydantic models for Megladon MD API"""
from pydantic import BaseModel, Field
from typing import Optional

class PharmacySource(BaseModel):
    id: str
    name: str
    base_url: str
    store_count: Optional[int] = None

class ProductResult(BaseModel):
    product_name: str
    price: int  # VND
    original_price: Optional[int] = None
    manufacturer: Optional[str] = None
    dosage_form: Optional[str] = None
    pack_size: int = 1
    unit_price: Optional[float] = None
    in_stock: bool = True
    product_url: Optional[str] = None

class PharmacySearchResult(BaseModel):
    source_id: str
    source_name: str
    status: str  # "success", "error", "pending", "searching"
    products: list[ProductResult] = []
    lowest_price: Optional[int] = None
    result_count: int = 0
    response_time_ms: Optional[int] = None
    error: Optional[str] = None

class SearchResponse(BaseModel):
    query: str
    results: dict[str, PharmacySearchResult]
    best_price: Optional[int] = None
    best_source: Optional[str] = None
    price_range: Optional[str] = None
    potential_savings: Optional[int] = None

class PriceRecord(BaseModel):
    source_id: str
    source_name: str
    product_name: str
    price: int
    unit_price: Optional[float] = None
    manufacturer: Optional[str] = None
    observed_at: str

class TrendData(BaseModel):
    query: str
    source_id: str
    source_name: str
    prices: list[PriceRecord]

class AlertConfig(BaseModel):
    drug_query: str
    price_threshold: int  # VND

class AlertResponse(BaseModel):
    id: int
    drug_query: str
    price_threshold: int
    is_active: bool

class MonitorConfig(BaseModel):
    drug_query: str
    interval_minutes: int = 15
    sources: str = "all"

class MonitorResponse(BaseModel):
    id: int
    drug_query: str
    interval_minutes: int
    is_active: bool

class OptimizeRequest(BaseModel):
    drugs: list[str]  # list of drug names

class OptimizeDrugResult(BaseModel):
    drug: str
    best_source: str
    best_price: int
    product_name: str

class OptimizeResponse(BaseModel):
    items: list[OptimizeDrugResult]
    total_optimized: int
    total_single_source: Optional[int] = None
    savings: Optional[int] = None
    best_single_source: Optional[str] = None


class MemoryRecallResponse(BaseModel):
    enabled: bool
    snippets: list[str]


class CurrentScanSnapshot(BaseModel):
    best_price: Optional[int] = None
    best_source: Optional[str] = None
    price_range: Optional[str] = None
    potential_savings: Optional[int] = None
    total_results: Optional[int] = None
    variants: list[str] = Field(default_factory=list)
    price_fluctuations: list[str] = Field(default_factory=list)


class InsightsRequest(BaseModel):
    user: str = Field(..., min_length=1)
    drug_query: str = Field(..., min_length=1)
    current_scan: CurrentScanSnapshot


class InsightsResponse(BaseModel):
    enabled: bool
    insight: str
    memory_snippets_used: int = 0
    error: Optional[str] = None
