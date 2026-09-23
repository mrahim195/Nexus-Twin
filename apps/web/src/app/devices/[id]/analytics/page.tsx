"use client";

import { useState } from "react";
import { MetricChart } from "@/components/MetricChart";
import { DevicePageFrame, PageSkeleton, useCachedJson, useDeviceId } from "@/hooks/useDevice";

type HistPoint = { t: string; cpu: number | null; ram: number | null; gpu: number | null };
type AnalyticsPayload = {
  comparison?: { changes: string[] };
  current?: {
    cpu: number | null;
    ram: number | null;
    expectedCpu: number | null;
    expectedRam: number | null;
    cpuDeviation: number | null;
    ramDeviation: number | null;
  };
};

export default function AnalyticsPage() {
  const id = useDeviceId();
  const [range, setRange] = useState("24h");

  const { data: history, loading: histLoading, refreshing: histRefreshing } = useCachedJson<HistPoint[]>(
    `${id}:history:${range}`,
    `/api/devices/${id}/history?range=${range}`,
    {
      pick: (json) => ((json as { points?: HistPoint[] }).points || []) as HistPoint[],
    }
  );

  const { data: analytics, loading: analLoading } = useCachedJson<AnalyticsPayload>(
    `${id}:analytics`,
    `/api/devices/${id}/analytics`,
    { intervalMs: 30000 }
  );

  const cur = analytics?.current;
  const points = history || [];
  const loading = (histLoading && !points.length) || (analLoading && !analytics);

  return (
    <DevicePageFrame title="ANALYTICS">
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {["1h", "24h", "7d", "30d"].map((r) => (
          <button
            key={r}
            type="button"
            className={range === r ? "btn" : "btn btn-ghost"}
            style={{ padding: "0.45rem 0.75rem", minHeight: "auto" }}
            onClick={() => setRange(r)}
          >
            {histRefreshing && range === r ? "…" : r.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? <PageSkeleton rows={3} /> : null}

      {!loading && (
        <>
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
            <MetricChart label={`CPU · ${range.toUpperCase()}`} points={points.map((p) => ({ t: String(p.t), v: p.cpu }))} />
            <MetricChart label={`RAM · ${range.toUpperCase()}`} points={points.map((p) => ({ t: String(p.t), v: p.ram }))} color="var(--warn)" />
            <MetricChart label={`GPU · ${range.toUpperCase()}`} points={points.map((p) => ({ t: String(p.t), v: p.gpu }))} color="#5ad4a0" />
          </div>
        </>
      )}
    </DevicePageFrame>
  );
}
