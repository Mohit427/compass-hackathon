// Single source of truth for risk-tier color semantics across the dashboard.
// Used by: ScoreGauge, the risk tier badge, and the result card's tint/border.
// Look up with getRiskColor(result.risk_tier) -- handles casing for you.

export const RISK_COLORS = {
  low: {
    hex: '#22c55e',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700',
    cardAccent: 'border-t-green-400 dark:border-t-green-600',
    cardTint: 'bg-green-50/50 dark:bg-green-950/10',
  },
  medium: {
    hex: '#f59e0b',
    badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    cardAccent: 'border-t-amber-400 dark:border-t-amber-600',
    cardTint: 'bg-amber-50/50 dark:bg-amber-950/10',
  },
  high: {
    hex: '#ef4444',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700',
    cardAccent: 'border-t-red-400 dark:border-t-red-600',
    cardTint: 'bg-red-50/50 dark:bg-red-950/10',
  },
};

const DEFAULT_RISK_COLOR = {
  hex: '#6366f1',
  badge: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-600',
  cardAccent: 'border-t-gray-300 dark:border-t-gray-600',
  cardTint: '',
};

export function getRiskColor(tier) {
  return RISK_COLORS[tier?.toLowerCase()] || DEFAULT_RISK_COLOR;
}

// Per-factor (sign-based) coloring for the SHAP bar chart -- reuses the same
// green/red that mean "safe"/"risky" everywhere else, just applied per-bar by
// sign rather than per-card by overall tier.
export const INCREASES_RISK_HEX = RISK_COLORS.high.hex;
export const DECREASES_RISK_HEX = RISK_COLORS.low.hex;

// Shared outcome framing: only "High" reads as a flag/rejection, Low and
// Medium both read as an approval for summary/comparison copy.
export function isApprovedTier(tier) {
  return tier?.toLowerCase() !== 'high';
}

export function outcomeLabel(tier) {
  return isApprovedTier(tier) ? 'Approved' : 'Flagged';
}
