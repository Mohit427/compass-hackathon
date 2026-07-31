// src/api.js

export const getScore = async (applicantData) => {
    try {
        // Point this URL to Tharanesh's FastAPI server
        const response = await fetch('http://localhost:8000/score', {
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