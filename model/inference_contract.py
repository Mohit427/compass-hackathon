"""
Inference Contract

This file defines the expected input features
and output format for the AI Credit Scoring Model.
"""

# ==========================================
# Input Features
# ==========================================

FEATURES = [
    "income_ratio",
    "cash_flow_stability",
    "revenue_trend_slope",
    "bill_punctuality",
    "gst_regularity",
    "ext_source_avg",
    "employment_stability"
]

# Restricted feature set for the "traditional bureau" comparison model --
# only signals a formal credit bureau would plausibly have, deliberately
# excluding the alt-data signals (cash flow, revenue trend, bill/GST
# regularity) that are this product's whole differentiator.
TRADITIONAL_FEATURES = [
    "ext_source_avg",
    "income_ratio",
    "employment_stability",
]

# ==========================================
# Output Labels
# ==========================================

LABELS = {
    0: "LOW RISK",
    1: "HIGH RISK"
}

# ==========================================
# Example Input
# ==========================================

EXAMPLE_INPUT = {
    "income_ratio": 0.82,
    "cash_flow_stability": 0.91,
    "revenue_trend_slope": 0.65,
    "bill_punctuality": 0.95,
    "gst_regularity": 1,
    "ext_source_avg": 0.81,
    "employment_stability": 6.5
}

# ==========================================
# Example Output
# ==========================================

EXAMPLE_OUTPUT = {
    "prediction": 0,
    "decision": "LOW RISK",
    "probability": {
        "LOW RISK": 0.94,
        "HIGH RISK": 0.06
    }
}

# ==========================================
# Utility Function
# ==========================================

def validate_input(data):
    """
    Checks whether all required features are present.
    """

    missing = []

    for feature in FEATURES:
        if feature not in data:
            missing.append(feature)

    if missing:
        raise ValueError(
            f"Missing required features: {missing}"
        )

    return True


# ==========================================
# Example Usage
# ==========================================

if __name__ == "__main__":

    validate_input(EXAMPLE_INPUT)

    print("Inference contract is valid.\n")

    print("Expected Features:")
    for feature in FEATURES:
        print("-", feature)

    print("\nPossible Predictions:")
    for key, value in LABELS.items():
        print(f"{key} -> {value}")