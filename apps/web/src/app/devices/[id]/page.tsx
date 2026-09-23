"use client";

import {
  StatusDot,
  MetricTile,
  fmtPercent,
  fmtBytes,
  healthFromPercent,
} from "@/components/metrics";
import { DevicePageFrame, PageSkeleton, useDevice } from "@/hooks/useDevice";

function mbps(bytesPerSec: number | null | undefined): string {
  if (bytesPerSec === null || bytesPerSec === undefined) return "N/A";
  return `${((bytesPerSec * 8) / 1_000_000).toFixed(1)} Mbps`;
}

export default function DeviceTwinPage() {
  const { live, meta, loading } = useDevice();

  const m = live?.metrics as {
    cpu?: { utilizationPercent: number | null; temperatureC: number | null; model: string | null };
    memory?: { usedPercent: number | null; usedBytes: number | null; totalBytes: number | null };
    disks?: Array<{ mount: string; usedPercent: number | null }>;
    gpu?: { utilizationPercent: number | null; name: string | null } | null;
    network?: {
      internetConnected: boolean | null;
      interfaces: Array<{
        downloadBytesPerSec: number | null;
        uploadBytesPerSec: number | null;
      }>;
    };
  } | null | undefined;

  const processes =
    (live?.processes as Array<{
      name: string;
      pid: number;
      cpuPercent: number | null;
      memoryBytes: number | null;
    }>) || [];
  const agent = live?.agent as {
    agentVersion: string;
    connected: boolean;
    telemetryActive: boolean;
    queueSize: number;
  } | null;

  const diskPct = m?.disks?.[0]?.usedPercent ?? null;
  const net = m?.network?.interfaces?.[0];
  const top = processes[0];
  const cpuH = healthFromPercent(m?.cpu?.utilizationPercent);
  const memH = healthFromPercent(m?.memory?.usedPercent);
  const diskH = healthFromPercent(diskPct);
  const status = (live?.status as string) || meta?.status || "UNKNOWN";

  return (
    <DevicePageFrame title="OVERVIEW">
      {loading && !live ? <PageSkeleton rows={4} /> : null}

      {(!loading || live) && (
        <>
          <div
            className="panel"
            style={{ padding: "1.25rem", marginBottom: "1rem", borderColor: "var(--border-strong)" }}
          >
            <div className="stack-sm" style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <div className="mono" style={{ color: "var(--accent)", fontSize: "0.75rem", letterSpacing: "0.16em" }}>
                  DIGITAL TWIN
                </div>
                <h2 className="mono" style={{ margin: "0.35rem 0 0", fontSize: "1.6rem" }}>
                  {meta?.name || "…"}
                </h2>
                <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
                  {meta?.osVersion || "N/A"}
                </div>
              </div>
              <StatusDot status={status} />
            </div>
            {status === "OFFLINE" && (
              <div className="mono" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6, overflowWrap: "anywhere" }}>
                Last seen: {meta?.lastSeenLabel}
                <br />
                Reason: {meta?.lastKnownReason || "Connection lost. Exact reason unknown."}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            <MetricTile label="CPU" value={fmtPercent(m?.cpu?.utilizationPercent)} hint={m?.cpu?.model || undefined} />
            <MetricTile
              label="MEMORY"
              value={fmtPercent(m?.memory?.usedPercent)}
              hint={
                m?.memory?.usedBytes != null && m?.memory?.totalBytes != null
                  ? `${fmtBytes(m.memory.usedBytes)} / ${fmtBytes(m.memory.totalBytes)}`
                  : undefined
              }
            />
            <MetricTile label="GPU" value={fmtPercent(m?.gpu?.utilizationPercent ?? null)} hint={m?.gpu?.name || undefined} />
            <MetricTile label="DISK" value={fmtPercent(diskPct)} hint={m?.disks?.[0]?.mount} />
            <MetricTile label="NETWORK" value={`${mbps(net?.downloadBytesPerSec)} ↓`} hint={`${mbps(net?.uploadBytesPerSec)} ↑`} />
            <MetricTile label="TEMP" value={m?.cpu?.temperatureC != null ? `${Math.round(m.cpu.temperatureC)}°C` : "N/A"} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.75rem" }}>
            <div className="panel" style={{ padding: "1.1rem" }}>
              <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.12em" }}>SYSTEM HEALTH</div>
              <HealthRow name="CPU" {...cpuH} />
              <HealthRow name="MEMORY" {...memH} />
              <HealthRow name="STORAGE" {...diskH} />
              <HealthRow name="NETWORK" label={m?.network?.internetConnected ? "NORMAL" : "CHECK"} icon={m?.network?.internetConnected ? "✓" : "!"} />
            </div>
            <div className="panel" style={{ padding: "1.1rem" }}>
              <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.12em" }}>TOP PROCESS</div>
              {top ? (
                <div style={{ marginTop: "0.75rem" }}>
                  <div className="mono" style={{ fontSize: "1.15rem" }}>{top.name}</div>
                  <div className="mono" style={{ color: "var(--text-muted)", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                    CPU {top.cpuPercent ?? "n/a"}% · RAM {fmtBytes(top.memoryBytes)} · PID {top.pid}
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-dim)" }}>No process data yet.</p>
              )}
            </div>
            <div className="panel" style={{ padding: "1.1rem" }}>
              <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.12em" }}>AGENT</div>
              {agent ? (
                <div className="mono" style={{ marginTop: "0.75rem", fontSize: "0.85rem", lineHeight: 1.8, color: "var(--text-muted)" }}>
                  Version {agent.agentVersion}
                  <br />
                  Status {agent.connected ? "Connected" : "Disconnected"}
                  <br />
                  Telemetry {agent.telemetryActive ? "Active" : "Idle"}
                  <br />
                  Queue {agent.queueSize}
                </div>
              ) : (
                <p style={{ color: "var(--text-dim)" }}>Awaiting first heartbeat.</p>
              )}
            </div>
          </div>
        </>
      )}
    </DevicePageFrame>
  );
}

function HealthRow({ name, label, icon }: { name: string; label: string; icon: string }) {
  return (
    <div className="mono" style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.65rem", fontSize: "0.8rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.45rem", minWidth: 0 }}>
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{name}</span>
      <span style={{ textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label} <span style={{ color: "var(--accent)" }}>{icon}</span>
      </span>
    </div>
  );
}
