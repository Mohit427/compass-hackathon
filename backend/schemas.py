from pydantic import BaseModel
from typing import List

# --- RESPONSE SCHEMAS (Contract C) ---
class FeatureImpact(BaseModel):
    feature: str
    impact: float

class ScoreResponse(BaseModel):
    score: int
    default_probability: float
    risk_tier: str
    top_factors: List[FeatureImpact]

# --- REQUEST SCHEMA (Based on Contract A) ---
class ApplicantData(BaseModel):
    income_ratio: float
    cash_flow_stability: float
    revenue_trend_slope: float
    bill_punctuality: float
    gst_regularity: float
    ext_source_avg: float
    employment_stability: float