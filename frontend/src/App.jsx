import { useState } from 'react';
import { getScore } from './api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

// Pre-loaded data for a smooth demo presentation
const sampleApplicants = {
  good: { income: 85000, loanAmount: 15000 },
  risky: { income: 30000, loanAmount: 45000 }
};

function App() {
  const [income, setIncome] = useState('');
  const [loanAmount, setLoanAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSampleChange = (e) => {
    const selected = e.target.value;
    if (sampleApplicants[selected]) {
      setIncome(sampleApplicants[selected].income);
      setLoanAmount(sampleApplicants[selected].loanAmount);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // We pass the actual form data here, even though our current mock API ignores it
      const data = await getScore({ income, loanAmount });
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

        <div className="demo-controls">
          <label htmlFor="sample-applicant">Load Sample Data: </label>
          <select id="sample-applicant" defaultValue="" onChange={handleSampleChange}>
            <option value="" disabled>Select Applicant...</option>
            <option value="good">Applicant A (Healthy Cash Flow)</option>
            <option value="risky">Applicant B (Irregular Filings)</option>
          </select>
        </div>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Income:
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>Loan Amount:
              <input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit">Get Score</button>
        </form>
      </section>

      {loading && <p role="status">Analyzing alternate data...</p>}
      {error && <p role="alert">{error}</p>}

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
          <div className="chart-container" style={{ width: '100%', height: 300, marginTop: '20px' }}>
            <ResponsiveContainer>
              <BarChart data={result.top_factors} layout="vertical" margin={{ left: 50 }}>
                <XAxis type="number" />
                <YAxis dataKey="feature" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="impact" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </>
  );
}

export default App;