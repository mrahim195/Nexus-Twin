"use client";

import { FormEvent, useState } from "react";
import { DevicePageFrame, useDeviceId } from "@/hooks/useDevice";

const SUGGESTIONS = [
  "Why is my computer slow?",
  "What is using the most RAM?",
  "What changed today?",
  "Why did my CPU spike?",
  "Is anything unusual happening?",
  "Who are you?",
];

interface Diagnosis {
  summary: string;
  observations: string[];
  likelyCauses: string[];
  evidence: string[];
  recommendations: string[];
  confidence: string;
  limitations: string[];
  provider?: "gemini" | "fallback" | string;
}

export default function AiPage() {
  const id = useDeviceId();
  const [question, setQuestion] = useState("Why is my computer slow?");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Diagnosis | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: id, question }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Diagnosis failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const providerLabel =
    result?.provider === "gemini"
      ? "GEMINI"
      : result?.provider === "fallback"
        ? "LOCAL RULES"
        : (result?.provider || "").toUpperCase();

  return (
    <DevicePageFrame title="AI DIAGNOSTICS">
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Ask about performance or the product. Gemini answers when available; otherwise local rules are used.
      </p>

      <form onSubmit={onSubmit} className="panel" style={{ padding: "1.1rem", marginBottom: "1rem" }}>
        <label className="label" htmlFor="q">
          Question
        </label>
        <textarea
          id="q"
          className="input"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ resize: "vertical", minHeight: "5rem" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0.45rem 0.65rem", fontSize: "0.7rem", minHeight: "auto" }}
              onClick={() => setQuestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          className={`btn${loading ? " btn-busy" : ""}`}
          type="submit"
          style={{ marginTop: "1rem" }}
          disabled={loading}
        >
          {loading ? "ANALYZING" : "ASK"}
        </button>
      </form>

      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      {result && (
        <div className="card-list">
          <div className="panel" style={{ padding: "1.1rem" }}>
            <div
              className="mono"
              style={{
                color: result.provider === "gemini" ? "var(--accent)" : "var(--warn)",
                fontSize: "0.75rem",
                letterSpacing: "0.1em",
              }}
            >
              {providerLabel} · {result.confidence.toUpperCase()} CONFIDENCE
            </div>
            <p style={{ marginBottom: 0, marginTop: "0.6rem", lineHeight: 1.5 }}>{result.summary}</p>
          </div>
          <Section title="FACTS" items={result.observations} />
          <Section title="LIKELY CAUSES" items={result.likelyCauses} tone="warn" />
          <Section title="EVIDENCE" items={result.evidence} />
          <Section title="RECOMMENDATIONS" items={result.recommendations} />
          <Section title="NOTES" items={result.limitations} tone="dim" />
        </div>
      )}
    </DevicePageFrame>
  );
}

function Section({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: "warn" | "dim";
}) {
  if (!items?.length) return null;
  return (
    <div className="panel" style={{ padding: "1rem" }}>
      <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
        {title}
      </div>
      <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1.1rem" }}>
        {items.map((item) => (
          <li
            key={item}
            style={{
              marginBottom: "0.35rem",
              color:
                tone === "warn"
                  ? "var(--warn)"
                  : tone === "dim"
                    ? "var(--text-dim)"
                    : "var(--text-muted)",
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
