import os
import sys

import joblib
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "model"))
from inference_contract import FEATURES  # noqa: E402

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "artifacts", "model.pkl")
_model = joblib.load(MODEL_PATH)

LOW_RISK_MAX = 0.08
MEDIUM_RISK_MAX = 0.20


def _risk_tier(default_probability: float) -> str:
    if default_probability < LOW_RISK_MAX:
        return "Low"
    if default_probability < MEDIUM_RISK_MAX:
        return "Medium"
    return "High"


def _top_factors(top_n: int = 3) -> list[dict]:
    importances = _model.feature_importances_
    ranked = sorted(zip(FEATURES, importances), key=lambda pair: pair[1], reverse=True)
    return [{"feature": name, "impact": round(float(importance), 3)} for name, importance in ranked[:top_n]]


def predict(features: dict) -> dict:
    row = pd.DataFrame([[features[f] for f in FEATURES]], columns=FEATURES)
    default_probability = float(_model.predict_proba(row)[0, 1])
    score = round(300 + (1 - default_probability) * 600)

    return {
        "score": score,
        "default_probability": round(default_probability, 4),
        "risk_tier": _risk_tier(default_probability),
        "top_factors": _top_factors(),
    }
