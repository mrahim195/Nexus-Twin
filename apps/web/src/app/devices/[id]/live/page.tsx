"use client";

import { MetricChart } from "@/components/MetricChart";
import { MetricTile, fmtPercent, fmtBytes } from "@/components/metrics";
import { DevicePageFrame, PageSkeleton, useCachedJson, useDevice } from "@/hooks/useDevice";

type HistPoint = { t: string; cpu: number | null; ram: number | null; gpu: number | null };

export default function LivePage() {
  const { deviceId, live, loading: liveLoading } = useDevice();
  const { data: history, loading: histLoading } = useCachedJson<HistPoint[]>(
    `${deviceId}:history:1h`,
    `/api/devices/${deviceId}/history?range=1h`,
    {
      intervalMs: 20000,
      pick: (json) => ((json as { points?: HistPoint[] }).points || []) as HistPoint[],
    }
  );

  const m = live?.metrics as {
    cpu?: { utilizationPercent: number | null };
    memory?: { usedPercent: number | null; usedBytes: number | null };
    gpu?: { utilizationPercent: number | null } | null;
    disks?: Array<{ usedPercent: number | null }>;
  } | null | undefined;

  const processes =
    (live?.processes as Array<{ name: string; cpuPercent: number | null; memoryBytes: number | null; pid: number }>) ||
    [];

  const showSkeleton = liveLoading && !live;

  return (
    <DevicePageFrame title="LIVE MONITOR">
      {showSkeleton ? <PageSkeleton rows={4} /> : null}
      {!showSkeleton && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.65rem", marginBottom: "1rem" }}>
            <MetricTile label="CPU" value={fmtPercent(m?.cpu?.utilizationPercent)} />
            <MetricTile label="RAM" value={fmtPercent(m?.memory?.usedPercent)} />
            <MetricTile label="GPU" value={fmtPercent(m?.gpu?.utilizationPercent ?? null)} />
            <MetricTile label="DISK" value={fmtPercent(m?.disks?.[0]?.usedPercent ?? null)} />
          </div>
          {histLoading && !(history?.length) ? (
            <div className="skeleton" style={{ minHeight: "10rem", marginBottom: "1rem" }} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
              <MetricChart label="CPU · LAST HOUR" points={(history || []).map((p) => ({ t: String(p.t), v: p.cpu }))} />
              <MetricChart label="RAM · LAST HOUR" points={(history || []).map((p) => ({ t: String(p.t), v: p.ram }))} color="var(--warn)" />
            </div>
          )}
          <div className="panel" style={{ padding: "1rem" }}>
            <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              TOP PROCESSES
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>NAME</th>
                    <th>PID</th>
                    <th>CPU</th>
                    <th>RAM</th>
                  </tr>
                </thead>
                <tbody>
                  {processes.slice(0, 12).map((p) => (
                    <tr key={`${p.pid}-${p.name}`}>
                      <td>{p.name}</td>
                      <td>{p.pid}</td>
                      <td>{p.cpuPercent ?? "n/a"}%</td>
                      <td>{fmtBytes(p.memoryBytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!processes.length && <p style={{ color: "var(--text-dim)" }}>Waiting for process snapshots…</p>}
          </div>
        </>
      )}
    </DevicePageFrame>
  );
}
