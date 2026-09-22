/** Deterministic anomaly / health thresholds (also compared to baselines later) */

export const THRESHOLDS = {
  cpuHighPercent: 90,
  cpuHighDurationSec: 120,
  ramHighPercent: 90,
  diskHighPercent: 90,
  temperatureWarnC: 85,
} as const;
