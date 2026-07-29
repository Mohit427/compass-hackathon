import { useState } from 'react';
import { getScore } from './api';
import './App.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await getScore({}); // We will wire up actual form state next
      setResult(data);
    } catch (err) {
      setError("Failed to fetch applicant score. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1>Bank SME Credit Dashboard</h1>

      <section className="input-section">
        <h2>Applicant Details</h2>

        {/* Demo Toggle for Presentation */}
        <div className="demo-controls">
          <label htmlFor="sample-applicant">Load Sample Data: </label>
          <select id="sample-applicant" defaultValue="">
            <option value="" disabled>Select Applicant...</option>
            <option value="good">Applicant A (Healthy Cash Flow)</option>
            <option value="risky">Applicant B (Irregular Filings)</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Income: <input type="number" name="income" required /></label>
          </div>
          <div>
            <label>Loan Amount: <input type="number" name="loanAmount" required /></label>
          </div>
          <button type="submit">Get Score</button>
        </form>
      </section>

      {/* Resilient Loading and Error Handling */}
      {loading && <p role="status">Analyzing alternate data...</p>}
      {error && <p role="alert">{error}</p>}

      {/* Results Dashboard */}
      {result && !loading && (
        <section className="results-section">
          <h2>Risk Breakdown</h2>

          <p className="score-value">Credit Score: {result.score}</p>
          <p>Default Probability: {(result.default_probability * 100).toFixed(1)}%</p>

          <span className={`badge ${result.risk_tier.toLowerCase()}`}>
            Tier: {result.risk_tier}
          </span>

          <h3>Top Contributing Factors</h3>
          <ul>
            {result.top_factors.map((factor, index) => (
              <li key={index}>{factor.feature} (Impact: {factor.impact})</li>
            ))}
          </ul>

          {/* Recharts Mount Point */}
          <div className="chart-container">
            <p><em>SHAP visualization chart will mount here</em></p>
          </div>
        </section>
      )}
    </>
  );
}

export default App;