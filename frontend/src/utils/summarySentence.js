import { readableFeatureName } from '../constants/featureNames';
import { isApprovedTier } from '../constants/riskColors';

const joinWithAnd = (phrases) => {
  if (phrases.length === 0) return '';
  if (phrases.length === 1) return phrases[0];
  return `${phrases[0]} and ${phrases[1]}`;
};

// topFactors carries SHAP-signed impact: negative = decreasing risk (good
// for the applicant), positive = increasing risk (bad). "Positive factor" in
// the plain-English sense (helped them get approved) is the negative-impact
// side -- the naming is intentionally inverted from the SHAP sign.
export function buildSummarySentence(topFactors, riskTier) {
  if (!topFactors || topFactors.length === 0) return '';

  const helping = [...topFactors].filter((f) => f.impact < 0).sort((a, b) => a.impact - b.impact);
  const hurting = [...topFactors].filter((f) => f.impact > 0).sort((a, b) => b.impact - a.impact);

  if (isApprovedTier(riskTier)) {
    const primary = helping.slice(0, 2).map((f) => readableFeatureName(f.feature, 'good'));
    const concern = hurting[0];
    let sentence = `Approved primarily due to ${primary.length ? joinWithAnd(primary) : 'a balanced overall profile'}`;
    if (concern) sentence += `, despite ${readableFeatureName(concern.feature, 'bad')}`;
    return `${sentence}.`;
  }

  const primary = hurting.slice(0, 2).map((f) => readableFeatureName(f.feature, 'bad'));
  const mitigating = helping[0];
  let sentence = `Flagged primarily due to ${primary.length ? joinWithAnd(primary) : 'multiple weak signals'}`;
  if (mitigating) sentence += `, despite ${readableFeatureName(mitigating.feature, 'good')}`;
  return `${sentence}.`;
}
