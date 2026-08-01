import os

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

from inference_contract import TRADITIONAL_FEATURES

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "processed", "features.csv")

data = pd.read_csv(DATA_PATH)

X = data[TRADITIONAL_FEATURES]
y = data["target"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

model = RandomForestClassifier(
    n_estimators=150,
    max_depth=10,
    min_samples_leaf=25,
    random_state=42,
    n_jobs=-1,
)

model.fit(X_train, y_train)

os.makedirs(os.path.join(os.path.dirname(__file__), "artifacts"), exist_ok=True)

joblib.dump(X_test, os.path.join(os.path.dirname(__file__), "artifacts", "X_test_traditional.pkl"))
joblib.dump(y_test, os.path.join(os.path.dirname(__file__), "artifacts", "y_test_traditional.pkl"))
joblib.dump(model, os.path.join(os.path.dirname(__file__), "artifacts", "model_traditional.pkl"))

print(f"Trained traditional model on {len(X_train):,} rows, held out {len(X_test):,} for evaluation.")
print("Model saved to artifacts/model_traditional.pkl")
