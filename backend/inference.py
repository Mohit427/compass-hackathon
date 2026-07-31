def predict(features: dict) -> dict:
    """
    STUBBED FUNCTION: 
    This temporarily mimics Mithunn's machine learning model so the backend isn't blocked.
    It returns hardcoded values that perfectly match Contract B.
    """
    return {
        "score": 720,
        "default_probability": 0.042,
        "risk_tier": "Low",
        "top_factors": [
            {"feature": "cash_flow_stability", "impact": 0.31},
            {"feature": "gst_regularity", "impact": 0.18}
        ]
    }