// Human-readable phrasing per feature, direction-aware: `good` is used when
// this factor is helping the applicant (SHAP impact < 0, i.e. decreasing
// risk); `bad` is used when it's hurting them (impact > 0, increasing risk).
// Needed because the same feature can be a strength for one applicant and a
// weakness for another -- a single neutral name can't carry that.
export const FEATURE_NAMES = {
  income_ratio: { good: 'a strong income-to-loan ratio', bad: 'a stretched income-to-loan ratio' },
  cash_flow_stability: { good: 'stable cash flow', bad: 'volatile cash flow' },
  revenue_trend_slope: { good: 'a growing revenue trend', bad: 'a declining revenue trend' },
  bill_punctuality: { good: 'reliable bill payment history', bad: 'irregular bill payment history' },
  gst_regularity: { good: 'consistent GST filings', bad: 'inconsistent GST filings' },
  ext_source_avg: { good: 'a strong external credit score', bad: 'a weak external credit score' },
  employment_stability: { good: 'stable employment history', bad: 'limited employment history' },
};

export function readableFeatureName(featureKey, direction) {
  const entry = FEATURE_NAMES[featureKey];
  if (!entry) return featureKey.replace(/_/g, ' ');
  return entry[direction] || entry.good;
}
