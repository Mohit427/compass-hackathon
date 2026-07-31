# Backend API - AI Credit Scoring Engine

This is the FastAPI backend that bridges the ML Model with the Frontend dashboard.

## How to Run Locally
1. Navigate to the backend folder: `cd backend`
2. Install requirements: `pip install fastapi uvicorn pydantic`
3. Start the server: `uvicorn main:app --reload`

## API Endpoints for Frontend (Yashvant)

### 1. Health Check
Use this to check if the API is running (good for demo uptime checks).
**GET /health**
```bash
curl -X 'GET' '[http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)' -H 'accept: application/json'
```

### 2. Get Credit Score
POST /score
Send the applicant's alternative data to receive the risk tier and score.

```bash
curl -X 'POST' \
  '[http://127.0.0.1:8000/score](http://127.0.0.1:8000/score)' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "income_ratio": 0.5,
  "cash_flow_stability": 0.8,
  "revenue_trend_slope": 0.1,
  "bill_punctuality": 0.9,
  "gst_regularity": 1.0,
  "ext_source_avg": 0.6
}'
```