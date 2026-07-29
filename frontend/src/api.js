// src/api.js

export const getScore = async (applicantData) => {
    // Simulating a 1.5-second network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Frozen Contract C - Exact shape Tharanesh's backend will return
    return {
        "score": 720,
        "default_probability": 0.042,
        "risk_tier": "Low",
        "top_factors": [
            { "feature": "Cash flow stability", "impact": 0.31 },
            { "feature": "GST filing regularity", "impact": 0.18 }
        ]
    };
};