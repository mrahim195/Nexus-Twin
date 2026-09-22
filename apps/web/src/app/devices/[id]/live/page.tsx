"use client";

import { useEffect, useState } from "react";
import { MetricChart } from "@/components/MetricChart";
import { MetricTile, fmtPercent, fmtBytes } from "@/components/metrics";
import { DevicePageFrame, useDeviceId, useLive } from "@/hooks/useDevice";

export default function LivePage() {
  const id = useDeviceId();
  const { live } = useLive(id, 4000);
  const [history, setHistory] = useState<Array<{ t: string; cpu: number | null; ram: number | null; gpu: number | null }>>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/devices/${id}/history?range=1h`);
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setHistory(data.points || []);
    }
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [id]);

  const m = live?.metrics as {
    cpu?: { utilizationPercent: number | null };
    memory?: { usedPercent: number | null; usedBytes: number | null };
    gpu?: { utilizationPercent: number | null } | null;
    disks?: Array<{ usedPercent: number | null }>;
    network?: { interfaces?: Array<{ downloadBytesPerSec: number | null; uploadBytesPerSec: number | null }> };
  } | null | undefined;

  const processes = (live?.processes as Array<{ name: string; cpuPercent: number | null; memoryBytes: number | null; pid: number }>) || [];

  return (
    <DevicePageFrame title="LIVE MONITOR">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.65rem", marginBottom: "1rem" }}>
        <MetricTile label="CPU" value={fmtPercent(m?.cpu?.utilizationPercent)} />
        <MetricTile label="RAM" value={fmtPercent(m?.memory?.usedPercent)} />
        <MetricTile label="GPU" value={fmtPercent(m?.gpu?.utilizationPercent ?? null)} />
        <MetricTile label="DISK" value={fmtPercent(m?.disks?.[0]?.usedPercent ?? null)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
        <MetricChart label="CPU · LAST HOUR" points={history.map((p) => ({ t: String(p.t), v: p.cpu }))} />
        <MetricChart label="RAM · LAST HOUR" points={history.map((p) => ({ t: String(p.t), v: p.ram }))} color="var(--warn)" />
      </div>
      <div className="panel" style={{ padding: "1rem" }}>
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          TOP PROCESSES
        </div>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {processes.slice(0, 10).map((p) => (
            <div key={`${p.pid}-${p.name}`} className="mono" style={{ display: "flex", justifyContent: "space-between", gap: "1rem", fontSize: "0.85rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.4rem" }}>
              <span>{p.name}</span>
              <span style={{ color: "var(--text-muted)" }}>
                CPU {p.cpuPercent ?? "—"}% · {fmtBytes(p.memoryBytes)}
              </span>
            </div>
          ))}
          {!processes.length && <p style={{ color: "var(--text-dim)" }}>Waiting for process snapshots…</p>}
        </div>
      </div>
    </DevicePageFrame>
  );
}
