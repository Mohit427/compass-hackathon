import joblib
import shap
import pandas as pd
import matplotlib.pyplot as plt

# ==========================================
# Load Model and Test Data
# ==========================================

model = joblib.load("artifacts/model.pkl")
X_test = joblib.load("artifacts/X_test.pkl")

# ==========================================
# Create SHAP Explainer
# ==========================================

explainer = shap.TreeExplainer(model)

# ==========================================
# Select First Applicant
# ==========================================

sample = X_test.iloc[[0]]

prediction = model.predict(sample)[0]
probability = model.predict_proba(sample)[0]

print("=" * 60)
print("FIRST APPLICANT")
print("=" * 60)

print(sample.T)

print("\nPrediction:", prediction)

if prediction == 0:
    print("Decision : LOW RISK")
else:
    print("Decision : HIGH RISK")

print(f"\nProbability of LOW RISK : {probability[0]:.2%}")
print(f"Probability of HIGH RISK: {probability[1]:.2%}")

# ==========================================
# SHAP Explanation
# ==========================================

sample_shap = explainer(sample)

# Use SHAP values for Class 1 (HIGH RISK)
values = sample_shap.values[0, :, 1]

importance = pd.DataFrame({
    "Feature": sample.columns,
    "SHAP Value": values
})

importance["Absolute SHAP"] = importance["SHAP Value"].abs()
importance = importance.sort_values(
    by="Absolute SHAP",
    ascending=False
)

print("\nFeature Contributions")
print("=" * 60)

for _, row in importance.iterrows():

    feature = row["Feature"]
    value = row["SHAP Value"]

    if value > 0:
        effect = "↑ Increased HIGH RISK probability"
    elif value < 0:
        effect = "↓ Decreased HIGH RISK probability"
    else:
        effect = "No Effect"

    print(f"{feature:25} {value:+.4f}   {effect}")

# ==========================================
# SHAP Summary Plot
# ==========================================

all_shap = explainer(X_test)

print("\nOpening SHAP Summary Plot...")

shap.summary_plot(
    all_shap.values[:, :, 1],
    X_test,
    show=False
)

plt.tight_layout()
plt.show()