import { aiDiagnosisSchema, type AiDiagnosisOutput } from "@nexus-twin/validation";
import type { AiEvidencePackage } from "@nexus-twin/types";

/**
 * Text diagnose models — rotate through these when one is 503/404.
 * Image/TTS/live/specialized models are intentionally excluded.
 */
const DEFAULT_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3-flash-preview",
  "gemini-flash-latest",
  "gemini-pro-latest",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-omni-1.1-flash",
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
];

/** Sticky round-robin indexes across requests in this process. */
let currentKeyIndex = 0;
let currentModelIndex = 0;

/** Cached live model list from Google (refreshed periodically). */
let discoveredModels: string[] | null = null;
let discoveredAt = 0;
const DISCOVER_TTL_MS = 10 * 60_000;

export type DiagnoseResult = {
  diagnosis: AiDiagnosisOutput;
  provider: "gemini" | "fallback";
};

/**
 * Call Google Gemini with a pre-built evidence package.
 * Watchdogs:
 * - Model 503 / high-demand / unavailable → next model (loops through full list)
 * - Key quota / auth → next key (loops)
 * Sticky indexes remember the last working model+key pair.
 */
export async function diagnoseWithGemini(
  evidence: AiEvidencePackage
): Promise<DiagnoseResult> {
  const keys = loadGeminiKeys();
  if (keys.length === 0) {
    return {
      provider: "fallback",
      diagnosis: fallbackDiagnosis(evidence, "missing_key"),
    };
  }

  const models = await resolveGeminiModels(keys[0]);

  let lastError = "No model attempted";
  const preferred = process.env.GEMINI_MODEL?.trim();
  const preferredIdx = preferred ? models.indexOf(preferred) : -1;
  const modelStart =
    preferredIdx >= 0
      ? preferredIdx
      : ((currentModelIndex % models.length) + models.length) % models.length;
  const keyStart =
    ((currentKeyIndex % keys.length) + keys.length) % keys.length;

  console.info(
    `[gemini] trying ${models.length} models (start: ${models[modelStart]})`
  );

  for (let mOffset = 0; mOffset < models.length; mOffset++) {
    const modelIdx = (modelStart + mOffset) % models.length;
    const model = models[modelIdx];

    for (let kOffset = 0; kOffset < keys.length; kOffset++) {
      const keyIdx = (keyStart + kOffset) % keys.length;
      const apiKey = keys[keyIdx];

      try {
        const result = await callGeminiModel(apiKey, model, evidence);
        if (result.ok) {
          currentModelIndex = modelIdx;
          currentKeyIndex = keyIdx;
          console.info(`[gemini] ok via ${model} (key #${keyIdx + 1})`);
          return { provider: "gemini", diagnosis: result.diagnosis };
        }

        lastError = result.error;
        console.warn(`[gemini] ${result.error}`);

        if (isQuotaError(result.status, result.error)) {
          console.warn(
            `[gemini] key #${keyIdx + 1}/${keys.length} quota/rate-limited; rotating key`
          );
          continue;
        }

        if (isAuthError(result.status, result.error)) {
          console.warn(
            `[gemini] key #${keyIdx + 1}/${keys.length} auth failed; rotating key`
          );
          continue;
        }

        if (
          isModelUnavailable(result.status, result.error) ||
          isModelOverloaded(result.status, result.error)
        ) {
          console.warn(
            `[gemini] model ${model} unavailable/overloaded; rotating model`
          );
          break; // next model
        }

        // Other hard error for this model — try next model
        console.warn(`[gemini] model ${model} failed; rotating model`);
        break;
      } catch (err) {
        lastError = err instanceof Error ? err.message : "Gemini call failed";
        console.warn(`[gemini] ${lastError}`);
        if (isQuotaError(undefined, lastError) || isAuthError(undefined, lastError)) {
          continue;
        }
        if (
          isModelUnavailable(undefined, lastError) ||
          isModelOverloaded(undefined, lastError)
        ) {
          break;
        }
        break;
      }
    }
  }

  return {
    provider: "fallback",
    diagnosis: fallbackDiagnosis(evidence, lastError),
  };
}

/**
 * Env models first, then defaults, then live API discovery (text models only).
 */
async function resolveGeminiModels(apiKey: string): Promise<string[]> {
  const out: string[] = [];
  const push = (v: string | undefined) => {
    const t = v?.trim();
    if (t && !out.includes(t)) out.push(t);
  };

  for (const m of loadGeminiModelsFromEnv()) push(m);
  for (const m of DEFAULT_MODELS) push(m);

  const live = await discoverTextModels(apiKey);
  for (const m of live) push(m);

  return out;
}

/**
 * Models from:
 * - GEMINI_MODEL (primary)
 * - GEMINI_MODEL_2, GEMINI_MODEL_3, ...
 * - GEMINI_MODELS (comma/newline-separated)
 */
function loadGeminiModelsFromEnv(): string[] {
  const out: string[] = [];
  const push = (v: string | undefined) => {
    const t = v?.trim();
    if (t && !out.includes(t)) out.push(t);
  };

  push(process.env.GEMINI_MODEL);

  const numbered = Object.entries(process.env)
    .filter(([name]) => /^GEMINI_MODEL_\d+$/i.test(name))
    .sort(([a], [b]) => {
      const na = Number(a.replace(/\D/g, "")) || 0;
      const nb = Number(b.replace(/\D/g, "")) || 0;
      return na - nb;
    });
  for (const [, value] of numbered) {
    push(value);
  }

  const csv = process.env.GEMINI_MODELS;
  if (csv) {
    for (const part of csv.split(/[,\n]/)) {
      push(part);
    }
  }

  return out;
}

/** Fetch generateContent text models from Google; cached 10 minutes. */
async function discoverTextModels(apiKey: string): Promise<string[]> {
  const now = Date.now();
  if (discoveredModels && now - discoveredAt < DISCOVER_TTL_MS) {
    return discoveredModels;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=200`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[gemini] model list HTTP ${res.status}`);
      return discoveredModels || [];
    }
    const data = (await res.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>;
    };
    const names = (data.models || [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => (m.name || "").replace(/^models\//, ""))
      .filter(isTextDiagnoseModel)
      .sort(compareModelPreference);

    discoveredModels = names;
    discoveredAt = now;
    console.info(`[gemini] discovered ${names.length} text models from API`);
    return names;
  } catch (err) {
    console.warn(
      `[gemini] model discovery failed: ${err instanceof Error ? err.message : "error"}`
    );
    return discoveredModels || [];
  }
}

/** Keep chat/text models; drop image, audio, research, etc. */
function isTextDiagnoseModel(name: string): boolean {
  if (!name) return false;
  if (
    /image|tts|transcribe|computer-use|deep-research|antigravity|lyria|robotics|native-audio|embedding|aqa|nano-banana|clip-preview/i.test(
      name
    )
  ) {
    return false;
  }
  if (/^gemma-\d/i.test(name)) return true;
  if (/^gemini-(flash|pro|omni)/i.test(name)) return true;
  if (/^gemini-[\d.]+-(flash|pro)/i.test(name)) return true;
  return false;
}

/** Prefer lite/flash aliases before heavier pro models. */
function compareModelPreference(a: string, b: string): number {
  return modelScore(a) - modelScore(b) || a.localeCompare(b);
}

function modelScore(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("flash-lite") || n.includes("flash_lite")) return 0;
  if (n.includes("flash")) return 1;
  if (n.includes("pro")) return 2;
  if (n.startsWith("gemma")) return 3;
  return 4;
}

/**
 * Keys from:
 * - GEMINI_API_KEY (primary)
 * - GEMINI_API_KEY_2, GEMINI_API_KEY_3, ... (watchdog extras)
 * - GEMINI_API_KEYS (optional comma/newline-separated list)
 * Deduped, order preserved.
 */
function loadGeminiKeys(): string[] {
  const out: string[] = [];
  const push = (v: string | undefined) => {
    const t = v?.trim();
    if (t && !out.includes(t)) out.push(t);
  };

  push(process.env.GEMINI_API_KEY);

  const numbered = Object.entries(process.env)
    .filter(([name]) => /^GEMINI_API_KEY_\d+$/i.test(name))
    .sort(([a], [b]) => {
      const na = Number(a.replace(/\D/g, "")) || 0;
      const nb = Number(b.replace(/\D/g, "")) || 0;
      return na - nb;
    });
  for (const [, value] of numbered) {
    push(value);
  }

  const csv = process.env.GEMINI_API_KEYS;
  if (csv) {
    for (const part of csv.split(/[,\n]/)) {
      push(part);
    }
  }

  return out;
}

function isQuotaError(status: number | undefined, message: string): boolean {
  if (status === 429) return true;
  return /quota|rate.?limit|resource.?exhausted|too many requests|exceeded your.?quota/i.test(
    message
  );
}

function isModelUnavailable(status: number | undefined, message: string): boolean {
  if (status === 404) return true;
  return /not found|no longer available/i.test(message);
}

/** 503 / high demand — rotate model, not key. */
function isModelOverloaded(status: number | undefined, message: string): boolean {
  if (status === 503) return true;
  return /high demand|overloaded|unavailable|try again later|UNAVAILABLE/i.test(
    message
  );
}

function isAuthError(status: number | undefined, message: string): boolean {
  if (status === 401 || status === 403) return true;
  return /api key not valid|invalid.?api.?key|permission.?denied|unauthorized/i.test(
    message
  );
}

async function callGeminiModel(
  apiKey: string,
  model: string,
  evidence: AiEvidencePackage
): Promise<
  | { ok: true; diagnosis: AiDiagnosisOutput }
  | { ok: false; error: string; status?: number }
> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const prompt = `You are NEXUS//TWIN, a personal computer digital-twin assistant.
Answer the user's question helpfully and briefly.

Rules:
- If the question is about identity (who are you / what is this), introduce NEXUS//TWIN clearly. Do NOT dump CPU/RAM stats unless asked.
- If the question is about performance/diagnostics, ground claims in the evidence JSON.
- Separate facts (observations) from hypotheses (likelyCauses).
- Keep arrays short (max 4 items each). No raw API jargon.

Return ONLY valid JSON:
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

Evidence (may be unused for non-diagnostic questions):
${JSON.stringify(evidence, null, 2)}`;

  const generationConfig: Record<string, unknown> = {
    temperature: 0.3,
    responseMimeType: "application/json",
    maxOutputTokens: 2048,
  };
  // Gemini 3.x thinking burns output tokens; disable so JSON actually lands.
  if (/gemini-3/i.test(model)) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      error: `${model}: HTTP ${res.status} ${text.slice(0, 160)}`,
    };
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  };
  const candidate = data.candidates?.[0];
  const raw =
    candidate?.content?.parts
      ?.filter((p) => !p.thought && p.text)
      .map((p) => p.text || "")
      .join("") ||
    candidate?.content?.parts?.map((p) => p.text || "").join("") ||
    "";

  if (!raw.trim()) {
    return {
      ok: false,
      status: 200,
      error: `${model}: empty response (${candidate?.finishReason || "no finishReason"})`,
    };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    const extracted = extractJsonObject(raw);
    if (!extracted) {
      return {
        ok: false,
        status: 200,
        error: `${model}: non-JSON response (${candidate?.finishReason || "unknown"})`,
      };
    }
    try {
      parsed = JSON.parse(extracted);
    } catch {
      return { ok: false, status: 200, error: `${model}: JSON parse failed` };
    }
  }

  try {
    const normalized = {
      summary: String(parsed.summary ?? ""),
      observations: asStringArray(parsed.observations).slice(0, 5),
      likelyCauses: asStringArray(
        parsed.likelyCauses ?? parsed.likely_causes
      ).slice(0, 4),
      evidence: asStringArray(parsed.evidence).slice(0, 5),
      recommendations: asStringArray(parsed.recommendations).slice(0, 4),
      confidence: (["low", "medium", "high"].includes(String(parsed.confidence))
        ? parsed.confidence
        : "medium") as "low" | "medium" | "high",
      limitations: asStringArray(parsed.limitations).slice(0, 3),
    };
    return { ok: true, diagnosis: aiDiagnosisSchema.parse(normalized) };
  } catch {
    return { ok: false, status: 200, error: `${model}: schema validation failed` };
  }
}

/** Local rules when Gemini is unavailable. */
export function fallbackDiagnosis(
  evidence: AiEvidencePackage,
  _reason: string
): AiDiagnosisOutput {
  const q = evidence.question.toLowerCase();

  // Identity / product questions — do not dump resource stats
  if (
    /\bwho are you\b|\bwhat are you\b|\bwhat is (this|nexus)\b|\byour name\b/.test(q)
  ) {
    return {
      summary:
        "I am NEXUS//TWIN, your personal computer digital twin. I explain machine behavior from telemetry your local agent collects.",
      observations: [
        "Local agent observes CPU, RAM, disk, network, GPU (when available), and processes.",
        "Cloud dashboard shows live state, history, anomalies, and AI answers grounded in that data.",
      ],
      likelyCauses: [],
      evidence: [],
      recommendations: [
        "Ask performance questions like: Why is my computer slow?",
        "Open Live Monitor or Processes for raw metrics.",
      ],
      confidence: "high",
      limitations: ["Gemini was unavailable, so this is a built-in product answer."],
    };
  }

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
      `Top process: ${top.name} (CPU ${top.cpuPercent ?? "n/a"}%, RAM ${formatBytes(top.memoryBytes)}).`
    );
  }

  const likelyCauses: string[] = [];
  if ((ram.peak ?? 0) >= 90 || (ram.average ?? 0) >= 85) {
    likelyCauses.push("Memory pressure looks more likely than pure CPU saturation.");
  } else if ((cpu.peak ?? 0) >= 90) {
    likelyCauses.push("CPU saturation looks likely from peak utilization.");
  } else {
    likelyCauses.push("No single metric clearly exceeds critical thresholds in this window.");
  }

  return {
    summary: observations.length
      ? `Local analysis for: "${evidence.question}"`
      : `Not enough telemetry to answer: "${evidence.question}"`,
    observations,
    likelyCauses,
    evidence: observations,
    recommendations: [
      "Check Processes for top consumers.",
      "Use Analytics for today vs yesterday.",
    ],
    confidence: observations.length ? "medium" : "low",
    limitations: ["Gemini was unavailable; this used local rules only."],
  };
}

function formatBytes(v: number | null | undefined): string {
  if (v == null) return "n/a";
  const gb = v / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${Math.round(v / 1024 ** 2)} MB`;
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

function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  return text.slice(start, end + 1);
}
