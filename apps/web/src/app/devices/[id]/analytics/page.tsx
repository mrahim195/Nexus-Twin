"use client";

import { useCallback, useEffect, useState } from "react";
import { MetricChart } from "@/components/MetricChart";
import { DevicePageFrame, useDeviceId } from "@/hooks/useDevice";

export default function AnalyticsPage() {
  const id = useDeviceId();
  const [range, setRange] = useState("24h");
  const [history, setHistory] = useState<Array<{ t: string; cpu: number | null; ram: number | null; gpu: number | null }>>([]);
  const [analytics, setAnalytics] = useState<{
    comparison?: { changes: string[] };
    current?: {
      cpu: number | null;
      ram: number | null;
      expectedCpu: number | null;
      expectedRam: number | null;
      cpuDeviation: number | null;
      ramDeviation: number | null;
    };
  } | null>(null);

  const load = useCallback(async () => {
    const [h, a] = await Promise.all([
      fetch(`/api/devices/${id}/history?range=${range}`),
      fetch(`/api/devices/${id}/analytics`),
    ]);
    if (h.ok) {
      const data = await h.json();
      setHistory(data.points || []);
    }
    if (a.ok) setAnalytics(await a.json());
  }, [id, range]);

  useEffect(() => {
    void load();
  }, [load]);

  const cur = analytics?.current;

  return (
    <DevicePageFrame title="ANALYTICS">
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {["1h", "24h", "7d", "30d"].map((r) => (
          <button
            key={r}
            type="button"
            className={range === r ? "btn" : "btn btn-ghost"}
            style={{ padding: "0.4rem 0.7rem" }}
            onClick={() => setRange(r)}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="panel" style={{ padding: "1.1rem", marginBottom: "1rem" }}>
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
          WHAT CHANGED · TODAY VS YESTERDAY
        </div>
        <ul style={{ margin: "0.75rem 0 0", paddingLeft: "1.1rem", color: "var(--text-muted)" }}>
          {(analytics?.comparison?.changes || ["Collect more telemetry to compare windows."]).map((c) => (
            <li key={c} className="mono" style={{ marginBottom: "0.35rem", fontSize: "0.85rem" }}>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="panel" style={{ padding: "1.1rem", marginBottom: "1rem" }}>
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
          BASELINE / CURRENT
        </div>
        <div className="mono" style={{ marginTop: "0.75rem", fontSize: "0.9rem", lineHeight: 1.8 }}>
          CURRENT RAM {cur?.ram ?? "UNAVAILABLE"}%
          <br />
          EXPECTED FOR THIS HOUR {cur?.expectedRam ?? "UNAVAILABLE"}%
          <br />
          DEVIATION {cur?.ramDeviation != null ? `${cur.ramDeviation > 0 ? "+" : ""}${cur.ramDeviation}%` : "UNAVAILABLE"}
          <br />
          CURRENT CPU {cur?.cpu ?? "UNAVAILABLE"}% · EXPECTED {cur?.expectedCpu ?? "UNAVAILABLE"}%
          {cur?.cpuDeviation != null ? ` · DEV ${cur.cpuDeviation > 0 ? "+" : ""}${cur.cpuDeviation}%` : ""}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
        <MetricChart label={`CPU · ${range.toUpperCase()}`} points={history.map((p) => ({ t: String(p.t), v: p.cpu }))} />
        <MetricChart label={`RAM · ${range.toUpperCase()}`} points={history.map((p) => ({ t: String(p.t), v: p.ram }))} color="var(--warn)" />
        <MetricChart label={`GPU · ${range.toUpperCase()}`} points={history.map((p) => ({ t: String(p.t), v: p.gpu }))} color="#5ad4a0" />
      </div>
    </DevicePageFrame>
  );
}
