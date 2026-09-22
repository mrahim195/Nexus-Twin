"use client";

import { useCallback, useEffect, useState } from "react";
import { DevicePageFrame, useDeviceId } from "@/hooks/useDevice";

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
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [scanning, setScanning] = useState(false);

  const load = useCallback(async (scan = false) => {
    setScanning(scan);
    const res = await fetch(`/api/devices/${id}/anomalies${scan ? "?scan=1" : ""}`);
    setScanning(false);
    if (res.ok) {
      const data = await res.json();
      setAnomalies(data.anomalies || []);
    }
  }, [id]);

  useEffect(() => {
    void load(true);
  }, [load]);

  return (
    <DevicePageFrame title="ANOMALIES">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
        <button className="btn" type="button" disabled={scanning} onClick={() => void load(true)}>
          {scanning ? "SCANNING…" : "SCAN NOW"}
        </button>
      </div>
      <div style={{ display: "grid", gap: "0.65rem" }}>
        {anomalies.map((a) => (
          <div key={a.id} className="panel" style={{ padding: "1rem", borderColor: a.severity === "critical" ? "var(--error)" : "var(--border)" }}>
            <div className="mono" style={{ color: "var(--warn)", fontSize: "0.85rem" }}>
              ⚠ {a.metric.toUpperCase()} ANOMALY · {a.severity.toUpperCase()}
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
        {!anomalies.length && (
          <div className="panel" style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
            No anomalies detected yet. Thresholds + baseline deviations are evaluated on scan.
          </div>
        )}
      </div>
    </DevicePageFrame>
  );
}
