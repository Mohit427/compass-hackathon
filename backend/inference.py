import os
import sys

import joblib
import numpy as np
import pandas as pd
import shap

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "model"))
from inference_contract import FEATURES, TRADITIONAL_FEATURES  # noqa: E402

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "artifacts", "model.pkl")
TRADITIONAL_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "artifacts", "model_traditional.pkl")
_model = joblib.load(MODEL_PATH)
_traditional_model = joblib.load(TRADITIONAL_MODEL_PATH)
_explainer = shap.TreeExplainer(_model)

LOW_RISK_MAX = 0.08
MEDIUM_RISK_MAX = 0.20

# Traditional-model score below which we call it "Rejected". Calibrated against
# the traditional model's own score distribution on real held-out applicants
# (~80th percentile), not against the full model's thresholds -- the two
# models are not on a shared, directly-comparable risk scale.
TRADITIONAL_APPROVAL_MIN_SCORE = 820


def _risk_tier(default_probability: float) -> str:
    if default_probability < LOW_RISK_MAX:
        return "Low"
    if default_probability < MEDIUM_RISK_MAX:
        return "Medium"
    return "High"


def _top_factors(row: pd.DataFrame, top_n: int = 3) -> list[dict]:
    """Per-applicant SHAP contributions toward the default (positive) class.

    Positive impact = pushed this applicant's risk up; negative = pushed it down.
    Shape from shap.TreeExplainer is (n_samples, n_features, n_classes) for this
    sklearn/shap version combo -- index 1 selects the "default" class.
    """
    shap_values = np.asarray(_explainer.shap_values(row))[0, :, 1]
    ranked = sorted(zip(FEATURES, shap_values), key=lambda pair: abs(pair[1]), reverse=True)
    return [{"feature": name, "impact": round(float(value), 3)} for name, value in ranked[:top_n]]


def _traditional_score(features: dict) -> dict:
    """Score from a second model restricted to bureau-plausible features only
    (ext_source_avg, income_ratio, employment_stability) -- deliberately
    excludes the alt-data signals that are this product's differentiator, to
    give an honest comparison against what a traditional lender could do.
    """
    row = pd.DataFrame([[features[f] for f in TRADITIONAL_FEATURES]], columns=TRADITIONAL_FEATURES)
    default_probability = float(_traditional_model.predict_proba(row)[0, 1])
    score = round(300 + (1 - default_probability) * 600)
    outcome = "Approved" if score >= TRADITIONAL_APPROVAL_MIN_SCORE else "Rejected"
    return {"score": score, "outcome": outcome}


def predict(features: dict) -> dict:
    row = pd.DataFrame([[features[f] for f in FEATURES]], columns=FEATURES)
    default_probability = float(_model.predict_proba(row)[0, 1])
    score = round(300 + (1 - default_probability) * 600)

    return {
        "score": score,
        "default_probability": round(default_probability, 4),
        "risk_tier": _risk_tier(default_probability),
        "top_factors": _top_factors(row),
        "traditional": _traditional_score(features),
    }
