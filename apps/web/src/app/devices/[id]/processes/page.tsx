"use client";

import { fmtBytes } from "@/components/metrics";
import { DevicePageFrame, PageSkeleton, useDevice } from "@/hooks/useDevice";

export default function ProcessesPage() {
  const { live, loading } = useDevice();
  const processes =
    (live?.processes as Array<{
      name: string;
      pid: number;
      cpuPercent: number | null;
      memoryBytes: number | null;
      parentPid: number | null;
    }>) || [];

  return (
    <DevicePageFrame title="PROCESSES">
      {loading && !live ? <PageSkeleton rows={3} /> : null}
      {!(!live && loading) && (
        <div className="panel" style={{ padding: "0.5rem 0" }}>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>PID</th>
                  <th className="hide-sm">PPID</th>
                  <th>CPU</th>
                  <th>RAM</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((p) => (
                  <tr key={p.pid}>
                    <td>{p.name}</td>
                    <td>{p.pid}</td>
                    <td className="hide-sm">{p.parentPid ?? "n/a"}</td>
                    <td>{p.cpuPercent ?? "UNAVAILABLE"}%</td>
                    <td>{fmtBytes(p.memoryBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!processes.length && (
            <div style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
              No process telemetry yet. Ensure the agent is ONLINE.
            </div>
          )}
        </div>
      )}
    </DevicePageFrame>
  );
}
