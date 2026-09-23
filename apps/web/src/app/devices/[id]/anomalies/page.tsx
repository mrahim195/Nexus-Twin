"use client";

import { useCallback, useState } from "react";
import { DevicePageFrame, PageSkeleton, useCachedJson, useDeviceId, writeCache } from "@/hooks/useDevice";

interface Anomaly {
  id: string;
  metric: string;
  observedValue: number | string;
  expectedValue: number | string | null;
  severity: string;
  relatedProcess: string | null;
  explanation: string;
  detectedAt: string;
}

export default function AnomaliesPage() {
  const id = useDeviceId();
  const [scanning, setScanning] = useState(false);
  const cacheId = `${id}:anomalies`;

  const { data: anomalies, loading, reload } = useCachedJson<Anomaly[]>(
    cacheId,
    `/api/devices/${id}/anomalies`,
    {
      pick: (json) => ((json as { anomalies?: Anomaly[] }).anomalies || []) as Anomaly[],
    }
  );

  const list = anomalies || [];

  const scanNow = useCallback(async () => {
    setScanning(true);
    try {
      const res = await fetch(`/api/devices/${id}/anomalies?scan=1`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const next = (data.anomalies || []) as Anomaly[];
        writeCache(`nexus:twin:res:${cacheId}`, next);
        await reload();
      }
    } finally {
      setScanning(false);
    }
  }, [id, cacheId, reload]);

  return (
    <DevicePageFrame title="ANOMALIES">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <button
          className={`btn${scanning ? " btn-busy" : ""}`}
          type="button"
          disabled={scanning}
          onClick={() => void scanNow()}
        >
          {scanning ? "SCANNING" : "SCAN NOW"}
        </button>
      </div>
      {loading && !list.length ? <PageSkeleton rows={3} /> : null}
      <div className="card-list">
        {list.map((a) => (
          <div key={a.id} className="panel" style={{ padding: "1rem", borderColor: a.severity === "critical" ? "var(--error)" : "var(--border)" }}>
            <div className="mono" style={{ color: "var(--warn)", fontSize: "0.85rem" }}>
              ! {a.metric.toUpperCase()} ANOMALY · {a.severity.toUpperCase()}
            </div>
            <p style={{ margin: "0.5rem 0", color: "var(--text)" }}>{a.explanation}</p>
            <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Observed: {String(a.observedValue)}
              {a.expectedValue != null ? ` · Expected: ${String(a.expectedValue)}` : ""}
              {a.relatedProcess ? ` · Related: ${a.relatedProcess}` : ""}
              <br />
              {new Date(a.detectedAt).toLocaleString()}
            </div>
          </div>
        ))}
        {!list.length && !loading && (
          <div className="panel" style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
            No anomalies detected yet. Tap SCAN NOW to evaluate thresholds and baselines.
          </div>
        )}
      </div>
    </DevicePageFrame>
  );
}
