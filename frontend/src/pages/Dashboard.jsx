import { useState } from 'react';
import { getScore } from '../api';
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

function Dashboard({ onBack, theme, onToggleTheme }) {
  const [income, setIncome] = useState('');
  const [loanAmount, setLoanAmount] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const isDark = theme === 'dark';

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
      case 'low': return 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'high': return 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-3xl mx-auto space-y-8">

          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
            >
              ← Back to Home
            </button>

            <button
              onClick={onToggleTheme}
              aria-label="Toggle dark mode"
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <h1 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white tracking-tight">
            Bank SME Credit Dashboard
          </h1>

          <section className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">Applicant Details</h2>

            <div className="mb-6 bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
              <label htmlFor="sample-applicant" className="block text-sm font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                Load Sample Demo Data:
              </label>
              <select
                id="sample-applicant"
                defaultValue=""
                onChange={handleSampleChange}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="" disabled>Select Applicant...</option>
                <option value="good">Applicant A (Healthy Cash Flow)</option>
                <option value="risky">Applicant B (Irregular Filings)</option>
              </select>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Annual Income (₹):
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Requested Loan Amount (₹):
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
              >
                Get Score
              </button>
            </form>
          </section>

          {/* Resilient Loading and Error States */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <p role="status" className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                Analyzing alternative data patterns...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/40 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-md">
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Results Dashboard */}
          {result && !loading && (
            <section className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Risk Breakdown</h2>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full border ${getBadgeColor(result.risk_tier)}`}>
                  Tier: {result.risk_tier}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Credit Score</p>
                  <p className="mt-2 text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{result.score}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Default Probability</p>
                  <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-gray-100">{(result.default_probability * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Top Contributing Factors</h3>
                <ul className="space-y-2">
                  {result.top_factors.map((factor, index) => (
                    <li key={index} className="flex items-center text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded">
                      <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                      <span className="font-medium">{factor.feature}</span>
                      <span className="ml-auto text-indigo-600 dark:text-indigo-400 font-mono text-sm">(Impact: {factor.impact})</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 text-center">SHAP Value Visualization</h3>
                <div className="chart-container w-full h-[300px]">
                  <ResponsiveContainer>
                    <BarChart data={result.top_factors} layout="vertical" margin={{ left: 50, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="feature" type="category" width={150} tick={{ fill: isDark ? '#d1d5db' : '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: isDark ? '#374151' : '#f3f4f6' }}
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          backgroundColor: isDark ? '#1f2937' : '#ffffff',
                          color: isDark ? '#f3f4f6' : '#111827',
                        }}
                      />
                      <Bar dataKey="impact" fill="#4f46e5" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
