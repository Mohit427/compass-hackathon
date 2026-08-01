import { RadialBarChart, RadialBar } from 'recharts';

const MIN_SCORE = 300;
const MAX_SCORE = 900;

// Local to the gauge for now -- item 3 of this UI pass consolidates this into
// a single shared risk-tier color source of truth used across the whole page.
const GAUGE_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const SWEEP_DEGREES = 180;

function ScoreGauge({ score, riskTier }) {
  const percentage = Math.min(100, Math.max(0, ((score - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100));
  const color = GAUGE_COLORS[riskTier?.toLowerCase()] || '#6366f1';

  // Recharts' RadialBarChart value-to-domain scaling is unreliable for a
  // single-entry gauge (see recharts/recharts#1089, #1157), so instead of
  // relying on PolarAngleAxis domain + value, we drive the sweep directly via
  // startAngle/endAngle (which IS reliable) on two stacked charts: a fixed
  // full-track background and a value arc whose endAngle we compute ourselves.
  const valueEndAngle = 180 - (percentage / 100) * SWEEP_DEGREES;

  const chartProps = {
    width: 220,
    height: 220,
    cx: '50%',
    cy: '50%',
    innerRadius: '75%',
    outerRadius: '100%',
    barSize: 16,
    startAngle: 180,
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="relative overflow-hidden" style={{ width: 220, height: 110 }}>
        <div className="absolute top-0 left-0">
          <RadialBarChart {...chartProps} endAngle={0} data={[{ value: 1, fill: '#e5e7eb' }]}>
            <RadialBar dataKey="value" cornerRadius={8} isAnimationActive={false} />
          </RadialBarChart>
        </div>
        <div className="absolute top-0 left-0">
          <RadialBarChart {...chartProps} endAngle={valueEndAngle} data={[{ value: 1, fill: color }]}>
            <RadialBar dataKey="value" cornerRadius={8} isAnimationActive={false} />
          </RadialBarChart>
        </div>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center leading-none">
          <span className="text-4xl font-extrabold" style={{ color }}>{score}</span>
        </div>
      </div>

      <div className="flex justify-between w-[220px] text-xs text-gray-400 dark:text-gray-500 px-3 mt-2">
        <span>{MIN_SCORE}</span>
        <span>{MAX_SCORE}</span>
      </div>
    </div>
  );
}

export default ScoreGauge;
