"use client";

import { fmtBytes } from "@/components/metrics";
import { DevicePageFrame, useDeviceId, useLive } from "@/hooks/useDevice";

function aggregate(
  processes: Array<{ name: string; cpuPercent: number | null; memoryBytes: number | null }>
) {
  const map = new Map<string, { name: string; count: number; cpu: number; ram: number }>();
  for (const p of processes) {
    const name = p.name.replace(/\.(exe|app)$/i, "");
    const key = name.toLowerCase();
    const cur = map.get(key) || { name, count: 0, cpu: 0, ram: 0 };
    cur.count += 1;
    cur.cpu += p.cpuPercent ?? 0;
    cur.ram += p.memoryBytes ?? 0;
    map.set(key, cur);
  }
  return [...map.values()]
    .sort((a, b) => b.ram - a.ram)
    .map((a) => ({
      ...a,
      status: a.ram > 2 * 1024 ** 3 || a.cpu > 50 ? "HIGH RESOURCE USAGE" : "ONLINE",
    }));
}

export default function ApplicationsPage() {
  const id = useDeviceId();
  const { live } = useLive(id);
  const apps = aggregate(
    (live?.processes as Array<{ name: string; cpuPercent: number | null; memoryBytes: number | null }>) ||
      []
  );

  return (
    <DevicePageFrame title="ACTIVE APPLICATIONS">
      <div style={{ display: "grid", gap: "0.55rem" }}>
        {apps.map((a) => (
          <div key={a.name} className="panel" style={{ padding: "0.9rem 1rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div className="mono" style={{ fontWeight: 600 }}>{a.name.toUpperCase()}</div>
              <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
                {a.count} processes · CPU {Math.round(a.cpu * 10) / 10}% · {fmtBytes(a.ram)}
              </div>
            </div>
            <div className="mono" style={{ color: a.status.includes("HIGH") ? "var(--warn)" : "var(--accent)", fontSize: "0.8rem" }}>
              {a.status}
            </div>
          </div>
        ))}
        {!apps.length && (
          <div className="panel" style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
            No application aggregates yet.
          </div>
        )}
      </div>
    </DevicePageFrame>
  );
}
