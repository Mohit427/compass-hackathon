"""
Simulate 180 days of daily UPI-style inflow/outflow per applicant.

Reads:  data/raw/application_train.csv
Writes: data/processed/synthetic_transactions.csv
"""
import os

import numpy as np
import pandas as pd

SEED = 42
N_DAYS = 180
START_DATE = "2025-01-01"
BATCH_SIZE = 20_000

RAW_PATH = os.path.join(os.path.dirname(__file__), "raw", "application_train.csv")
OUT_PATH = os.path.join(os.path.dirname(__file__), "processed", "synthetic_transactions.csv")


def generate_batch(rng, applicant_ids, incomes, dates, weekend_mask):
    b = len(applicant_ids)
    n = N_DAYS

    base_daily_inflow = np.clip(incomes / 365.0, 50.0, None)

    weekend_dip = rng.random(b) < 0.5
    weekend_mult = np.where(weekend_dip, rng.uniform(0.5, 0.8, b), 1.0)

    risk_type = rng.choice(["normal", "decline", "volatile"], size=b, p=[0.85, 0.08, 0.07])
    trend_end_mult = np.empty(b)
    inflow_noise_scale = np.empty(b)
    trend_end_mult[risk_type == "normal"] = rng.uniform(0.95, 1.15, (risk_type == "normal").sum())
    trend_end_mult[risk_type == "decline"] = rng.uniform(0.35, 0.65, (risk_type == "decline").sum())
    trend_end_mult[risk_type == "volatile"] = rng.uniform(0.90, 1.10, (risk_type == "volatile").sum())
    inflow_noise_scale[risk_type == "normal"] = rng.uniform(0.08, 0.15, (risk_type == "normal").sum())
    inflow_noise_scale[risk_type == "decline"] = rng.uniform(0.10, 0.18, (risk_type == "decline").sum())
    inflow_noise_scale[risk_type == "volatile"] = rng.uniform(0.30, 0.50, (risk_type == "volatile").sum())

    outflow_ratio = rng.uniform(0.55, 0.95, b)
    outflow_noise_scale = inflow_noise_scale * rng.uniform(0.9, 1.3, b)

    spike_prob_in = rng.uniform(0.02, 0.05, b)
    spike_prob_out = rng.uniform(0.02, 0.05, b)

    day_idx = np.arange(n)
    trend_factor = 1.0 + (trend_end_mult[:, None] - 1.0) * (day_idx[None, :] / (n - 1))
    weekday_factor = np.where(weekend_mask[None, :], weekend_mult[:, None], 1.0)

    inflow_mean = base_daily_inflow[:, None] * trend_factor * weekday_factor
    inflow = inflow_mean * rng.normal(1.0, inflow_noise_scale[:, None], (b, n))
    spike_mask_in = rng.random((b, n)) < spike_prob_in[:, None]
    inflow = np.where(spike_mask_in, inflow * rng.uniform(2.0, 5.0, (b, n)), inflow)
    inflow = np.clip(inflow, 0, None)

    outflow_mean = inflow_mean * outflow_ratio[:, None]
    outflow = outflow_mean * rng.normal(1.0, outflow_noise_scale[:, None], (b, n))
    spike_mask_out = rng.random((b, n)) < spike_prob_out[:, None]
    outflow = np.where(spike_mask_out, outflow * rng.uniform(1.5, 3.0, (b, n)), outflow)
    outflow = np.clip(outflow, 0, None)

    return pd.DataFrame({
        "applicant_id": np.repeat(applicant_ids, n),
        "date": np.tile(dates, b),
        "inflow_amount": inflow.ravel().round(2),
        "outflow_amount": outflow.ravel().round(2),
    })


def main():
    apps = pd.read_csv(RAW_PATH, usecols=["SK_ID_CURR", "AMT_INCOME_TOTAL"])
    apps["AMT_INCOME_TOTAL"] = apps["AMT_INCOME_TOTAL"].fillna(apps["AMT_INCOME_TOTAL"].median())

    dates = pd.date_range(START_DATE, periods=N_DAYS, freq="D")
    weekend_mask = dates.weekday.values >= 5
    date_strs = dates.strftime("%Y-%m-%d").values

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

    ids = apps["SK_ID_CURR"].to_numpy()
    incomes = apps["AMT_INCOME_TOTAL"].to_numpy()
    n_applicants = len(ids)

    rng = np.random.default_rng(SEED)
    first_batch = True
    for start in range(0, n_applicants, BATCH_SIZE):
        end = min(start + BATCH_SIZE, n_applicants)
        batch_df = generate_batch(rng, ids[start:end], incomes[start:end], date_strs, weekend_mask)
        batch_df.to_csv(OUT_PATH, mode="w" if first_batch else "a", header=first_batch, index=False)
        first_batch = False
        print(f"applicants {start}-{end} / {n_applicants} written")

    print(f"Done. Wrote {n_applicants * N_DAYS:,} rows to {OUT_PATH}")


if __name__ == "__main__":
    main()
