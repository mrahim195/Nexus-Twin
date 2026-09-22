/** Structured AI diagnosis — facts vs hypotheses must stay distinct */

export type AiConfidence = "low" | "medium" | "high";

export interface AiEvidencePackage {
  deviceId: string;
  question: string;
  windowStart: string;
  windowEnd: string;
  cpuSummary: Record<string, unknown>;
  memorySummary: Record<string, unknown>;
  diskSummary: Record<string, unknown>;
  gpuSummary: Record<string, unknown> | null;
  networkSummary: Record<string, unknown>;
  topProcesses: Array<Record<string, unknown>>;
  recentEvents: Array<Record<string, unknown>>;
  baselines: Record<string, unknown> | null;
  limitations: string[];
}

export interface AiDiagnosis {
  id: string;
  deviceId: string;
  question: string;
  summary: string;
  observations: string[];
  likelyCauses: string[];
  evidence: string[];
  recommendations: string[];
  confidence: AiConfidence;
  limitations: string[];
  createdAt: string;
}
