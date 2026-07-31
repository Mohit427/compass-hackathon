import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import joblib
import os
data = pd.read_csv("dummy_data/features.csv")
# print(data.head())

# Separate input features and target column
X = data.drop("target", axis=1)
y = data["target"]

# print(X.head())
# print(y.head())

# Split the dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# print("Training samples:", len(X_train))
# print("Testing samples:", len(X_test))

# Create the Random Forest model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Train the model
model.fit(X_train, y_train)
# Create the artifacts folder if it doesn't exist
os.makedirs("artifacts", exist_ok=True)

# Save the trained model
# Save the test data for evaluation
joblib.dump(X_test, "artifacts/X_test.pkl")
joblib.dump(y_test, "artifacts/y_test.pkl")

print("✅ Test data saved")
joblib.dump(model, "artifacts/model.pkl")

print("✅ Model saved to artifacts/model.pkl")