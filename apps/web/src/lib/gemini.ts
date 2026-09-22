import { aiDiagnosisSchema, type AiDiagnosisOutput } from "@nexus-twin/validation";
import type { AiEvidencePackage } from "@nexus-twin/types";

const DEFAULT_MODEL = "gemini-2.0-flash";

/**
 * Call Google Gemini with a pre-built evidence package.
 * Never sends continuous raw telemetry — only deterministic evidence.
 */
export async function diagnoseWithGemini(
  evidence: AiEvidencePackage
): Promise<AiDiagnosisOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackDiagnosis(evidence, "GEMINI_API_KEY is not configured on the server.");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are NEXUS//TWIN, a systems diagnostics assistant.
You MUST ground every claim in the evidence JSON below.
Distinguish:
- observations = facts present in evidence
- likely_causes = hypotheses (never present as proven facts)
- recommendations = actions
- limitations = what you cannot know

Return ONLY valid JSON matching this schema:
{
  "summary": string,
  "observations": string[],
  "likelyCauses": string[],
  "evidence": string[],
  "recommendations": string[],
  "confidence": "low" | "medium" | "high",
  "limitations": string[]
}

User question: ${evidence.question}

Evidence package:
${JSON.stringify(evidence, null, 2)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return fallbackDiagnosis(
        evidence,
        `Gemini API error ${res.status}: ${text.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const raw =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "";

    const parsed = JSON.parse(stripFences(raw));
    const normalized = {
      summary: String(parsed.summary ?? ""),
      observations: asStringArray(parsed.observations),
      likelyCauses: asStringArray(
        parsed.likelyCauses ?? parsed.likely_causes
      ),
      evidence: asStringArray(parsed.evidence),
      recommendations: asStringArray(parsed.recommendations),
      confidence: (["low", "medium", "high"].includes(parsed.confidence)
        ? parsed.confidence
        : "medium") as "low" | "medium" | "high",
      limitations: asStringArray(parsed.limitations),
    };

    return aiDiagnosisSchema.parse(normalized);
  } catch (err) {
    return fallbackDiagnosis(
      evidence,
      err instanceof Error ? err.message : "Gemini call failed"
    );
  }
}

/** Deterministic diagnosis when Gemini is unavailable — still evidence-based. */
export function fallbackDiagnosis(
  evidence: AiEvidencePackage,
  reason: string
): AiDiagnosisOutput {
  const cpu = evidence.cpuSummary as { average?: number | null; peak?: number | null };
  const ram = evidence.memorySummary as {
    average?: number | null;
    peak?: number | null;
  };
  const top = evidence.topProcesses[0] as
    | { name?: string; memoryBytes?: number | null; cpuPercent?: number | null }
    | undefined;

  const observations: string[] = [];
  if (cpu.average != null) {
    observations.push(`CPU average ${cpu.average}% (peak ${cpu.peak ?? "n/a"}%).`);
  }
  if (ram.average != null) {
    observations.push(`RAM average ${ram.average}% (peak ${ram.peak ?? "n/a"}%).`);
  }
  if (top?.name) {
    observations.push(
      `Top process by recent snapshot: ${top.name} (CPU ${top.cpuPercent ?? "n/a"}%, RAM bytes ${top.memoryBytes ?? "n/a"}).`
    );
  }

  const likelyCauses: string[] = [];
  if ((ram.peak ?? 0) >= 90 || (ram.average ?? 0) >= 85) {
    likelyCauses.push(
      "Memory pressure appears more likely than CPU saturation based on observed percentages."
    );
  } else if ((cpu.peak ?? 0) >= 90) {
    likelyCauses.push(
      "CPU saturation appears likely based on peak utilization in the evidence window."
    );
  } else {
    likelyCauses.push(
      "No single metric clearly exceeds critical thresholds in the evidence window; cause may be intermittent or outside collected metrics."
    );
  }

  return {
    summary:
      observations.length > 0
        ? `Deterministic analysis of the evidence window for: "${evidence.question}"`
        : `Insufficient telemetry to answer: "${evidence.question}"`,
    observations,
    likelyCauses,
    evidence: observations,
    recommendations: [
      "Review top memory/CPU consumers in the Processes view.",
      "Compare today vs yesterday in Analytics → What changed.",
    ],
    confidence: observations.length ? "medium" : "low",
    limitations: [
      ...evidence.limitations,
      `Gemini path unavailable or failed: ${reason}`,
      "This response was produced by deterministic rules, not a generative model.",
    ],
  };
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

function stripFences(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return t;
}
