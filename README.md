# Credit Lens

**AI-powered alternative credit scoring for SMEs without formal credit history.**

Built for the Campus Crew Hackathon Final (Aug 1, 2026).

Millions of small businesses get turned away from credit simply because they
lack a formal credit history. Credit Lens builds a risk profile from
real behavioral signals — cash flow patterns, bill payment habits, business
tenure — so lenders can say yes to businesses traditional bureau scoring
overlooks.

---

## How it works

```
data/  →  model/  →  backend/  →  frontend/
raw data     train      FastAPI      React
+ features   RF models  /score API   dashboard
```

1. **`data/`** turns the Kaggle "Home Credit Default Risk" dataset plus a
   simulated 180-day UPI-style transaction history into a clean, 7-feature
   table per applicant.
2. **`model/`** trains two RandomForest classifiers on that table: the main
   alt-data model (all 7 features) and a second "traditional bureau" model
   restricted to the 3 features a formal credit bureau would plausibly have.
3. **`backend/`** is a FastAPI service that loads both models, runs
   per-applicant SHAP explanations, and exposes a single `/score` endpoint.
4. **`frontend/`** is a React dashboard where a lender enters an applicant's
   income and requested loan amount and gets back a score, a risk tier, a
   plain-English explanation, and a side-by-side comparison against a
   traditional bureau score.

---

## Repo structure

```
compass-hackathon/
├── data/
│   ├── raw/                       Kaggle source CSVs (gitignored, not committed)
│   ├── processed/                 Generated features.csv + synthetic transactions (gitignored)
│   ├── synthetic_transactions.py  Simulates 180 days of UPI-style cash flow per applicant
│   ├── feature_engineering.py     Builds the frozen 7-feature + target table
│   └── README.md                  Full feature documentation & regeneration steps
├── model/
│   ├── train.py                   Trains the main (alt-data) model
│   ├── train_traditional.py       Trains the restricted "traditional bureau" model
│   ├── evaluate.py / explain.py   Metrics + SHAP inspection
│   ├── inference_contract.py      Single source of truth for feature lists
│   └── artifacts/                 Trained .pkl models (committed, ~9MB each)
├── backend/
│   ├── main.py                    FastAPI app (/health, /score)
│   ├── inference.py                Loads both models, computes scores + SHAP factors
│   └── schemas.py                 Pydantic request/response contract
├── frontend/
│   └── src/
│       ├── pages/                 Landing, Dashboard, HowItWorks
│       ├── components/            ScoreGauge, TransactionTicker
│       ├── constants/             Shared risk-tier colors, readable feature names
│       └── utils/                 Plain-language summary sentence generator
└── README.md                      You are here
```

---

## Getting started

Each module has its own `requirements.txt` / `package.json`. Run them in
this order — each step depends on the previous one's output.

### 1. Data pipeline

```bash
cd data
pip install -r requirements.txt
python synthetic_transactions.py   # ~55M rows, a few minutes, ~1.8GB output
python feature_engineering.py      # writes processed/features.csv
```

See [`data/README.md`](data/README.md) for what every feature means and how
it's computed.

### 2. Train the models

```bash
cd model
pip install -r requirements.txt
python train.py               # main alt-data model -> artifacts/model.pkl
python train_traditional.py   # bureau-only comparison model -> artifacts/model_traditional.pkl
python evaluate.py            # prints accuracy / precision / recall / F1
```

### 3. Backend API

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Health check: `curl http://localhost:8000/health`

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. Set `VITE_API_URL` (see `frontend/.env`)
to point at wherever the backend is running — defaults to
`http://localhost:8000` for local dev.

---

## API

### `POST /score`

**Request** (`ApplicantData`):

```json
{
  "income_ratio": 0.82,
  "cash_flow_stability": 0.91,
  "revenue_trend_slope": 0.65,
  "bill_punctuality": 0.95,
  "gst_regularity": 1.0,
  "ext_source_avg": 0.81,
  "employment_stability": 6.5
}
```

**Response** (`ScoreResponse`):

```json
{
  "score": 865,
  "default_probability": 0.0578,
  "risk_tier": "Low",
  "top_factors": [
    { "feature": "ext_source_avg", "impact": -0.058 },
    { "feature": "bill_punctuality", "impact": 0.031 },
    { "feature": "gst_regularity", "impact": 0.014 }
  ],
  "traditional": { "score": 880, "outcome": "Approved" }
}
```

- `score` — 300–900 scale, higher is better.
- `risk_tier` — `Low` / `Medium` / `High`, calibrated against the model's
  real probability distribution on held-out data.
- `top_factors` — per-applicant SHAP values (not global feature importance):
  positive impact increases risk, negative decreases it.
- `traditional` — the same applicant scored by the bureau-only model, for
  the dashboard's comparison panel.

### `GET /health`

Returns `{"status": "API is live and healthy!"}`.

---

## The model

Both models are `RandomForestClassifier` (150 trees, max depth 10),
trained on 307,511 real applicants from the Home Credit dataset.

| | Features used | AUC |
|---|---|---|
| **Main (alt-data) model** | income_ratio, cash_flow_stability, revenue_trend_slope, bill_punctuality, gst_regularity, ext_source_avg, employment_stability | 0.72 |
| **Traditional (bureau-only) model** | ext_source_avg, income_ratio, employment_stability | 0.72 |

**Known limitation, stated plainly:** four of the seven alt-data features
(`cash_flow_stability`, `revenue_trend_slope`, `bill_punctuality`,
`gst_regularity`) are derived from *simulated* transaction data — there's no
real UPI/bank feed behind this demo, since that data doesn't exist for the
Kaggle dataset. Because the simulation is generated independently of the
real repayment outcome, these features carry little real predictive power,
which is why the two models' AUCs land so close together. The dashboard's
"Applicant C" comparison scenario is deliberately calibrated (via a 330k-
sample search against the real trained models) to show a genuine, honest
gap where our model approves and the bureau-only model rejects — it is not
representative of the average applicant. Making the alt-data signal
*actually* predictive would mean sourcing (or more carefully simulating)
real transaction-outcome correlation — a natural next step beyond this
hackathon build.

---

## Dashboard features

- **Landing page** — glassmorphism intro with an animated background.
- **How It Works** — plain-English walkthrough of all 7 signals and a
  glossary, aimed at non-financial readers.
- **Dashboard**, with:
  - Semicircular radial score gauge, animated count-up in sync with the fill
  - Light/dark mode (synced across pages, persisted)
  - Signed SHAP factor chart (red = increasing risk, green = decreasing),
    sorted by magnitude
  - Auto-generated plain-language summary sentence
  - Traditional Bureau Score vs. Our Alt-Data Score comparison panel
  - Live mock transaction ticker
  - "What if?" slider — drag `ext_source_avg` and watch the score
    re-compute live against the real model (debounced)

---

## Team

| Module | Owner |
|---|---|
| Data & feature engineering | Mohit |
| Model training | Mithunn |
| Backend API | Tharanesh |
| Frontend dashboard | Yashvant |
