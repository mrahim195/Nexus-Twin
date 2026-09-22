/** Anomaly records from deterministic + baseline detection */

export type AnomalySeverity = "low" | "medium" | "high" | "critical";

export interface Anomaly {
  id: string;
  deviceId: string;
  metric: string;
  observedValue: number | string;
  expectedValue: number | string | null;
  severity: AnomalySeverity;
  relatedProcess: string | null;
  relatedApplication: string | null;
  explanation: string;
  detectedAt: string;
}
