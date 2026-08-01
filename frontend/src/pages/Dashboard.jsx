import { useEffect, useRef, useState } from 'react';
import { getScore } from '../api';
import { BarChart, Bar, Cell, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer } from 'recharts';
import ScoreGauge from '../components/ScoreGauge';
import TransactionTicker from '../components/TransactionTicker';
import { getRiskColor, INCREASES_RISK_HEX, DECREASES_RISK_HEX, isApprovedTier, outcomeLabel } from '../constants/riskColors';
import { buildSummarySentence } from '../utils/summarySentence';

// Pre-loaded data for a smooth demo presentation
const sampleApplicants = {
  good: { income: 85000, loanAmount: 15000 },
  risky: { income: 30000, loanAmount: 45000 },
  thinFile: { income: 70000, loanAmount: 18000 },
};

const TRADITIONAL_MOCK_SCORE = 580;
const WHAT_IF_DEBOUNCE_MS = 400;

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
  const [showComparison, setShowComparison] = useState(false);

  // The full feature payload behind the currently-shown result, so the
  // what-if slider can vary one feature while holding the rest fixed.
  const [currentFeatures, setCurrentFeatures] = useState(null);
  const [whatIfValue, setWhatIfValue] = useState(null);
  const [whatIfLoading, setWhatIfLoading] = useState(false);
  const whatIfTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (whatIfTimeoutRef.current) clearTimeout(whatIfTimeoutRef.current);
    };
  }, []);

  const isDark = theme === 'dark';

  // Sorted once and reused for both the chart's data and its per-bar Cell
  // colors -- Recharts matches Cells to bars positionally, so both must come
  // from the exact same ordered array or colors end up on the wrong bars.
  const sortedFactors = result
    ? [...result.top_factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    : [];

  const handleSampleChange = (e) => {
    const selected = e.target.value;
    if (selected === 'custom') {
      setIncome('');
      setLoanAmount('');
      return;
    }
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
      setCurrentFeatures(mlPayload);
      setWhatIfValue(mlPayload.cash_flow_stability);
    } catch (err) {
      setError("Failed to fetch applicant score. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatIfChange = (e) => {
    const value = parseFloat(e.target.value);
    setWhatIfValue(value);

    if (whatIfTimeoutRef.current) clearTimeout(whatIfTimeoutRef.current);
    setWhatIfLoading(true);
    whatIfTimeoutRef.current = setTimeout(async () => {
      const updatedFeatures = { ...currentFeatures, cash_flow_stability: value };
      try {
        const data = await getScore(updatedFeatures);
        setResult(data);
        setCurrentFeatures(updatedFeatures);
      } catch (err) {
        // Keep showing the last good result; the slider stays interactive.
      } finally {
        setWhatIfLoading(false);
      }
    }, WHAT_IF_DEBOUNCE_MS);
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
                <option value="thinFile">Applicant C (New to Credit — Thin File)</option>
                <option value="custom">Custom Applicant (Enter Your Own)</option>
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

          {/* Live transaction feed (mock -- gives a "live monitoring" feel) */}
          {result && !loading && <TransactionTicker />}

          {/* Results Dashboard */}
          {result && !loading && (
            <section className={`bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 border-t-4 transition-colors ${getRiskColor(result.risk_tier).cardAccent} ${getRiskColor(result.risk_tier).cardTint}`}>
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Risk Breakdown</h2>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full border ${getRiskColor(result.risk_tier).badge}`}>
                  Tier: {result.risk_tier}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Credit Score</p>
                  <ScoreGauge score={result.score} riskTier={result.risk_tier} />
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center border border-gray-100 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Default Probability</p>
                  <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-gray-100">{(result.default_probability * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="mb-6">
                <button
                  onClick={() => setShowComparison((s) => !s)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {showComparison ? 'Hide' : 'Compare with'} Traditional Bureau Score
                </button>

                {showComparison && (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 rounded-lg p-4 text-center">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Traditional Bureau Score</p>
                      <p className="text-3xl font-extrabold text-gray-400 dark:text-gray-500">{TRADITIONAL_MOCK_SCORE}</p>
                      <p className="mt-2 flex items-center justify-center gap-1.5 font-bold text-sm text-red-600 dark:text-red-400">
                        <span aria-hidden="true">✗</span> Rejected
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Thin file — insufficient credit history</p>
                    </div>
                    <div className={`border-2 rounded-lg p-4 text-center ${isApprovedTier(result.risk_tier) ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20' : 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20'}`}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Our Alt-Data Score</p>
                      <p className="text-3xl font-extrabold" style={{ color: getRiskColor(result.risk_tier).hex }}>{result.score}</p>
                      <p className={`mt-2 flex items-center justify-center gap-1.5 font-bold text-sm ${isApprovedTier(result.risk_tier) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <span aria-hidden="true">{isApprovedTier(result.risk_tier) ? '✓' : '✗'}</span> {outcomeLabel(result.risk_tier)}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Based on cash flow, bill history & more</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-center text-gray-700 dark:text-gray-300 italic mb-6">
                {buildSummarySentence(result.top_factors, result.risk_tier)}
              </p>

              <div className="mt-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 text-center">SHAP Value Visualization</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mb-2">
                  <span style={{ color: INCREASES_RISK_HEX }} className="font-semibold">Red</span> increases risk ·{' '}
                  <span style={{ color: DECREASES_RISK_HEX }} className="font-semibold">Green</span> decreases risk
                </p>
                <div className="chart-container w-full h-[300px]">
                  <ResponsiveContainer>
                    <BarChart data={sortedFactors} layout="vertical" margin={{ left: 50, right: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="feature" type="category" width={150} tick={{ fill: isDark ? '#d1d5db' : '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <ReferenceLine x={0} stroke={isDark ? '#4b5563' : '#d1d5db'} />
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
                      <Bar dataKey="impact" radius={4} barSize={24}>
                        {sortedFactors.map((factor) => (
                          <Cell key={factor.feature} fill={factor.impact >= 0 ? INCREASES_RISK_HEX : DECREASES_RISK_HEX} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {currentFeatures && (
                <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      What If: Cash Flow Stability
                    </h3>
                    <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                      {whatIfValue.toFixed(2)}
                      {whatIfLoading && <span className="text-indigo-500 dark:text-indigo-400 animate-pulse ml-1.5">updating…</span>}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={whatIfValue}
                    onChange={handleWhatIfChange}
                    className="w-full accent-indigo-600"
                    aria-label="What if: cash flow stability"
                  />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <span>0.0 (Unstable)</span>
                    <span>1.0 (Very Stable)</span>
                  </div>
                </div>
              )}

            </section>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
