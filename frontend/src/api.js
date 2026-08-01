// src/api.js

// Set VITE_API_URL in the deployment environment to point at the deployed
// backend; falls back to localhost for local dev.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getScore = async (applicantData) => {
    try {
        const response = await fetch(`${API_URL}/score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Passing the income and loanAmount from your React state
            body: JSON.stringify(applicantData),
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status} ${response.statusText}`);
        }

        // Returns the data matching Contract C
        return await response.json();
    } catch (error) {
        console.error("Error fetching score from backend:", error);
        throw error;
    }
};