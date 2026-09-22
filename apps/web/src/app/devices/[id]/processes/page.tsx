"use client";

import { fmtBytes } from "@/components/metrics";
import { DevicePageFrame, useDeviceId, useLive } from "@/hooks/useDevice";

export default function ProcessesPage() {
  const id = useDeviceId();
  const { live } = useLive(id);
  const processes = (live?.processes as Array<{
    name: string;
    pid: number;
    cpuPercent: number | null;
    memoryBytes: number | null;
    parentPid: number | null;
  }>) || [];

  return (
    <DevicePageFrame title="PROCESSES">
      <div style={{ display: "grid", gap: "0.55rem" }}>
        {processes.map((p) => (
          <div key={`${p.pid}`} className="panel" style={{ padding: "0.85rem 1rem" }}>
            <div className="mono" style={{ fontWeight: 600 }}>{p.name}</div>
            <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              PID {p.pid}
              {p.parentPid != null ? ` · PPID ${p.parentPid}` : ""} · CPU {p.cpuPercent ?? "UNAVAILABLE"}% · RAM {fmtBytes(p.memoryBytes)}
            </div>
          </div>
        ))}
        {!processes.length && (
          <div className="panel" style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
            No process telemetry yet. Ensure the agent is ONLINE.
          </div>
        )}
      </div>
    </DevicePageFrame>
  );
}
