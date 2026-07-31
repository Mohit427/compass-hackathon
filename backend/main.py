from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas import ApplicantData, ScoreResponse
from inference import predict

app = FastAPI(title="AI Credit Scoring API")

# Enable CORS so Yashvant's frontend can call this API locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local hackathon development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Uptime check for judges and demo reliability."""
    return {"status": "API is live and healthy!"}

@app.post("/score", response_model=ScoreResponse)
def get_credit_score(applicant_data: ApplicantData):
    """
    Receives applicant data from the frontend, passes it to the AI model,
    and returns the predicted credit score and risk factors.
    """
    # Convert Pydantic request model to a dictionary
    features_dict = applicant_data.model_dump()
    
    # Pass the data to your (currently stubbed) inference model
    prediction = predict(features_dict)
    
    # Return the result
    return prediction