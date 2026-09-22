"use client";

import { FormEvent, useState } from "react";
import { DevicePageFrame, useDeviceId } from "@/hooks/useDevice";

const SUGGESTIONS = [
  "Why is my computer slow?",
  "What is using the most RAM?",
  "What changed today?",
  "Why did my CPU spike?",
  "Is anything unusual happening?",
  "Compare today with yesterday.",
  "Show me my worst performance period today.",
];

interface Diagnosis {
  summary: string;
  observations: string[];
  likelyCauses: string[];
  evidence: string[];
  recommendations: string[];
  confidence: string;
  limitations: string[];
  provider?: string;
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

  return (
    <DevicePageFrame title="AI DIAGNOSTICS">
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Ask your computer… Answers are grounded in telemetry evidence. Gemini is used only when you ask — never continuously.
      </p>

      <form onSubmit={onSubmit} className="panel" style={{ padding: "1.1rem", marginBottom: "1rem" }}>
        <label className="label" htmlFor="q">Question</label>
        <textarea
          id="q"
          className="input"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{ resize: "vertical" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.75rem" }}>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn-ghost"
              style={{ padding: "0.35rem 0.55rem", fontSize: "0.7rem" }}
              onClick={() => setQuestion(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="btn" type="submit" style={{ marginTop: "1rem" }} disabled={loading}>
          {loading ? "ANALYZING…" : "ASK GEMINI / ANALYZE"}
        </button>
      </form>

      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      {result && (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          <div className="panel" style={{ padding: "1.1rem" }}>
            <div className="mono" style={{ color: "var(--accent)", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
              SUMMARY · CONFIDENCE {result.confidence.toUpperCase()} · {result.provider || "gemini"}
            </div>
            <p style={{ marginBottom: 0 }}>{result.summary}</p>
          </div>
          <Section title="OBSERVATIONS (facts)" items={result.observations} />
          <Section title="LIKELY CAUSES (hypotheses)" items={result.likelyCauses} tone="warn" />
          <Section title="EVIDENCE" items={result.evidence} />
          <Section title="RECOMMENDATIONS" items={result.recommendations} />
          <Section title="LIMITATIONS" items={result.limitations} tone="dim" />
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
        {!items.length && <li style={{ color: "var(--text-dim)" }}>None</li>}
      </ul>
    </div>
  );
}
