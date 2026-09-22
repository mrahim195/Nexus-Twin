import { z } from "zod";

export const aiDiagnoseRequestSchema = z.object({
  deviceId: z.string().min(1),
  question: z.string().min(3).max(2000),
  windowStart: z.string().datetime().optional(),
  windowEnd: z.string().datetime().optional(),
});

export const aiDiagnosisSchema = z.object({
  summary: z.string(),
  observations: z.array(z.string()),
  likelyCauses: z.array(z.string()),
  evidence: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
  limitations: z.array(z.string()),
});

export type AiDiagnoseRequest = z.infer<typeof aiDiagnoseRequestSchema>;
export type AiDiagnosisOutput = z.infer<typeof aiDiagnosisSchema>;
