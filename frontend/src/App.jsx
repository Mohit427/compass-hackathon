import { useState } from 'react';
import { getScore } from './api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Pre-loaded data for a smooth demo presentation
const sampleApplicants = {
  good: { income: 85000, loanAmount: 15000 },
  risky: { income: 30000, loanAmount: 45000 }
};

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);
const lerp = (healthy, risky, riskFactor) => healthy + (risky - healthy) * riskFactor;

// Demo-only mock: derives every ML feature from a single risk factor driven by
// BOTH the loan-to-income ratio and absolute income, so a loan that dwarfs income
// pushes every feature toward "risky" together instead of only income_ratio moving.
const buildMockFeatures = (inc, loan) => {
  const debtToIncome = inc > 0 ? loan / inc : loan > 0 ? Infinity : 0;
  const debtRisk = clamp01((debtToIncome - 0.3) / (5 - 0.3));
  const incomeRisk = clamp01((60000 - inc) / 60000);
  // Eased (not linear): the model's dominant feature (ext_source_avg) only moves
  // risk meaningfully below ~0.5, so moderate scenarios need to push further in.
  const riskFactor = Math.pow(Math.max(debtRisk, incomeRisk), 0.6);

  return {
    income_ratio: loan > 0 ? parseFloat((inc / loan).toFixed(2)) : 1.0,
    cash_flow_stability: parseFloat(lerp(0.9, 0.3, riskFactor).toFixed(2)),
    revenue_trend_slope: parseFloat(lerp(0.1, -0.4, riskFactor).toFixed(2)),
    bill_punctuality: parseFloat(lerp(0.95, 0.25, riskFactor).toFixed(2)),
    gst_regularity: parseFloat(lerp(0.9, 0.2, riskFactor).toFixed(2)),
    ext_source_avg: parseFloat(lerp(0.8, 0.2, riskFactor).toFixed(2)),
    employment_stability: parseFloat(lerp(8, 1, riskFactor).toFixed(1)),
  };
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
      const inc = Number(income);
      const loan = Number(loanAmount);

      // Transform raw inputs into the exact Pydantic schema Tharanesh expects
      const mlPayload = buildMockFeatures(inc, loan);

      // Send the properly mapped schema to the backend
      const data = await getScore(mlPayload);
      setResult(data);
    } catch (err) {
      setError("Failed to fetch applicant score. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to dynamically style the risk badge
  const getBadgeColor = (tier) => {
    switch (tier.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">

        <h1 className="text-3xl font-extrabold text-center text-gray-900 tracking-tight">
          Bank SME Credit Dashboard
        </h1>

        <section className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Applicant Details</h2>

          <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <label htmlFor="sample-applicant" className="block text-sm font-semibold text-indigo-900 mb-2">
              Load Sample Demo Data:
            </label>
            <select
              id="sample-applicant"
              defaultValue=""
              onChange={handleSampleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white"
            >
              <option value="" disabled>Select Applicant...</option>
              <option value="good">Applicant A (Healthy Cash Flow)</option>
              <option value="risky">Applicant B (Irregular Filings)</option>
            </select>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Income (₹):
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requested Loan Amount (₹):
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Get Score
            </button>
          </form>
        </section>

        {/* Resilient Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <p role="status" className="text-indigo-600 font-medium animate-pulse">
              Analyzing alternative data patterns...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <p role="alert" className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results Dashboard */}
        {result && !loading && (
          <section className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center border-b pb-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800">Risk Breakdown</h2>
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full border ${getBadgeColor(result.risk_tier)}`}>
                Tier: {result.risk_tier}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Credit Score</p>
                <p className="mt-2 text-4xl font-extrabold text-indigo-600">{result.score}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Default Probability</p>
                <p className="mt-2 text-4xl font-extrabold text-gray-900">{(result.default_probability * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Contributing Factors</h3>
              <ul className="space-y-2">
                {result.top_factors.map((factor, index) => (
                  <li key={index} className="flex items-center text-gray-600 bg-gray-50 px-3 py-2 rounded">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                    <span className="font-medium">{factor.feature}</span>
                    <span className="ml-auto text-indigo-600 font-mono text-sm">(Impact: {factor.impact})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 text-center">SHAP Value Visualization</h3>
              <div className="chart-container w-full h-[300px]">
                <ResponsiveContainer>
                  <BarChart data={result.top_factors} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="feature" type="category" width={150} tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="impact" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </section>
        )}
      </div>
    </div>
  );
}

export default App;