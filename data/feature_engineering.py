"""
Build the frozen feature table for the model-training module.

Reads:
    data/raw/application_train.csv
    data/raw/bureau.csv
    data/processed/synthetic_transactions.csv

Writes:
    data/processed/features.csv

Column contract (frozen, do not reorder/rename without team sign-off):
    applicant_id, income_ratio, cash_flow_stability, revenue_trend_slope,
    bill_punctuality, gst_regularity, ext_source_avg, employment_stability, target
"""
import os

import numpy as np
import pandas as pd

DATA_DIR = os.path.dirname(__file__)
APPLICATION_PATH = os.path.join(DATA_DIR, "raw", "application_train.csv")
BUREAU_PATH = os.path.join(DATA_DIR, "raw", "bureau.csv")
TRANSACTIONS_PATH = os.path.join(DATA_DIR, "processed", "synthetic_transactions.csv")
OUT_PATH = os.path.join(DATA_DIR, "processed", "features.csv")

FINAL_COLUMNS = [
    "applicant_id", "income_ratio", "cash_flow_stability", "revenue_trend_slope",
    "bill_punctuality", "gst_regularity", "ext_source_avg", "employment_stability", "target",
]

DAYS_EMPLOYED_PLACEHOLDER = 365243
OVERDUE_SCALE_DAYS = 30.0
GAP_SCALE_DAYS = 180.0


def compute_income_ratio(app):
    credit = app["AMT_CREDIT"].replace(0, np.nan)
    ratio = app["AMT_INCOME_TOTAL"] / credit
    return ratio.replace([np.inf, -np.inf], np.nan)


def compute_ext_source_avg(app):
    return app[["EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3"]].mean(axis=1, skipna=True)


def compute_employment_stability(app):
    days_employed = app["DAYS_EMPLOYED"].replace(DAYS_EMPLOYED_PLACEHOLDER, np.nan)
    years_employed = (-days_employed / 365.0).clip(lower=0, upper=50)
    return years_employed


def compute_cash_flow_features(transactions):
    tx = transactions.copy()
    tx["date"] = pd.to_datetime(tx["date"])
    start_date = tx["date"].min()
    tx["day_idx"] = (tx["date"] - start_date).dt.days

    n = tx.groupby("applicant_id")["day_idx"].transform("count")
    grouped = tx.groupby("applicant_id")

    inflow_mean = grouped["inflow_amount"].mean()
    inflow_std = grouped["inflow_amount"].std().fillna(0.0)
    cash_flow_stability = 1.0 / (1.0 + inflow_std / inflow_mean.replace(0, np.nan))
    cash_flow_stability = cash_flow_stability.fillna(0.0).clip(lower=0.0, upper=1.0)

    tx["xy"] = tx["day_idx"] * tx["inflow_amount"]
    sum_x = tx.groupby("applicant_id")["day_idx"].sum()
    sum_x2 = tx.groupby("applicant_id")["day_idx"].apply(lambda s: (s * s).sum())
    sum_y = tx.groupby("applicant_id")["inflow_amount"].sum()
    sum_xy = tx.groupby("applicant_id")["xy"].sum()
    count = tx.groupby("applicant_id")["day_idx"].count()

    denom = count * sum_x2 - sum_x ** 2
    slope = (count * sum_xy - sum_x * sum_y) / denom.replace(0, np.nan)
    slope = slope.fillna(0.0)

    return pd.DataFrame({
        "applicant_id": inflow_mean.index,
        "cash_flow_stability": cash_flow_stability.values,
        "revenue_trend_slope": slope.reindex(inflow_mean.index).values,
    })


def compute_bureau_features(bureau):
    b = bureau.copy()

    overdue_mean = b.groupby("SK_ID_CURR")["CREDIT_DAY_OVERDUE"].mean()
    bill_punctuality = 1.0 / (1.0 + overdue_mean / OVERDUE_SCALE_DAYS)

    b_sorted = b.sort_values(["SK_ID_CURR", "DAYS_CREDIT_UPDATE"])
    gaps = b_sorted.groupby("SK_ID_CURR")["DAYS_CREDIT_UPDATE"].diff().abs()
    gap_std = gaps.groupby(b_sorted["SK_ID_CURR"]).std()
    gst_regularity = 1.0 / (1.0 + gap_std / GAP_SCALE_DAYS)

    out = pd.DataFrame({
        "SK_ID_CURR": overdue_mean.index,
        "bill_punctuality": bill_punctuality.values,
    }).merge(
        pd.DataFrame({"SK_ID_CURR": gst_regularity.index, "gst_regularity": gst_regularity.values}),
        on="SK_ID_CURR", how="outer",
    )
    return out.rename(columns={"SK_ID_CURR": "applicant_id"})


def main():
    app = pd.read_csv(APPLICATION_PATH, usecols=[
        "SK_ID_CURR", "TARGET", "AMT_INCOME_TOTAL", "AMT_CREDIT",
        "EXT_SOURCE_1", "EXT_SOURCE_2", "EXT_SOURCE_3", "DAYS_EMPLOYED",
    ]).rename(columns={"SK_ID_CURR": "applicant_id", "TARGET": "target"})

    bureau = pd.read_csv(BUREAU_PATH, usecols=[
        "SK_ID_CURR", "CREDIT_DAY_OVERDUE", "DAYS_CREDIT_UPDATE",
    ])

    transactions = pd.read_csv(TRANSACTIONS_PATH, dtype={
        "applicant_id": "int32", "inflow_amount": "float32", "outflow_amount": "float32",
    }, parse_dates=False)

    features = pd.DataFrame({"applicant_id": app["applicant_id"]})
    features["income_ratio"] = compute_income_ratio(app)
    features["ext_source_avg"] = compute_ext_source_avg(app)
    features["employment_stability"] = compute_employment_stability(app)
    features["target"] = app["target"]

    cash_flow = compute_cash_flow_features(transactions)
    bureau_feats = compute_bureau_features(bureau)

    features = features.merge(cash_flow, on="applicant_id", how="left")
    features = features.merge(bureau_feats, on="applicant_id", how="left")

    for col in ["income_ratio", "cash_flow_stability", "revenue_trend_slope",
                "bill_punctuality", "gst_regularity", "ext_source_avg", "employment_stability"]:
        median = features[col].replace([np.inf, -np.inf], np.nan).median()
        features[col] = features[col].replace([np.inf, -np.inf], np.nan).fillna(median)

    features["cash_flow_stability"] = features["cash_flow_stability"].clip(lower=0.0, upper=1.0)
    features["bill_punctuality"] = features["bill_punctuality"].clip(lower=0.0, upper=1.0)
    features["gst_regularity"] = features["gst_regularity"].clip(lower=0.0, upper=1.0)
    features["target"] = features["target"].astype(int)

    features = features[FINAL_COLUMNS]

    assert not features.isna().any().any(), "NaN values remain in features.csv"
    assert np.isfinite(features.drop(columns=["applicant_id"]).to_numpy()).all(), "Infinite values remain"
    assert list(features.columns) == FINAL_COLUMNS, "Column contract violated"
    assert set(features["target"].unique()) <= {0, 1}, "target has values outside {0,1}"

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    features.to_csv(OUT_PATH, index=False)
    print(f"Wrote {len(features):,} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
