"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DeviceShell } from "@/components/DeviceShell";
import {
  StatusDot,
  MetricTile,
  fmtPercent,
  fmtBytes,
  healthFromPercent,
} from "@/components/metrics";

interface LivePayload {
  status: string;
  metrics: {
    cpu: { utilizationPercent: number | null; temperatureC: number | null; model: string | null };
    memory: { usedPercent: number | null; usedBytes: number | null; totalBytes: number | null };
    disks: Array<{ mount: string; usedPercent: number | null }>;
    gpu: { utilizationPercent: number | null; name: string | null } | null;
    network: {
      internetConnected: boolean | null;
      interfaces: Array<{
        downloadBytesPerSec: number | null;
        uploadBytesPerSec: number | null;
      }>;
    };
  } | null;
  processes: Array<{
    name: string;
    pid: number;
    cpuPercent: number | null;
    memoryBytes: number | null;
  }>;
  agent: {
    agentVersion: string;
    connected: boolean;
    telemetryActive: boolean;
    queueSize: number;
  } | null;
}

interface DeviceMeta {
  name: string;
  osVersion: string;
  lastSeenLabel: string;
  lastKnownReason: string | null;
  status: string;
}

function mbps(bytesPerSec: number | null | undefined): string {
  if (bytesPerSec === null || bytesPerSec === undefined) return "UNAVAILABLE";
  return `${((bytesPerSec * 8) / 1_000_000).toFixed(1)} Mbps`;
}

export default function DeviceTwinPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [meta, setMeta] = useState<DeviceMeta | null>(null);
  const [live, setLive] = useState<LivePayload | null>(null);

  const load = useCallback(async () => {
    const [dRes, lRes] = await Promise.all([
      fetch(`/api/devices/${id}`),
      fetch(`/api/devices/${id}/live`),
    ]);
    if (dRes.status === 401 || lRes.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (dRes.ok) {
      const d = await dRes.json();
      setMeta(d.device);
    }
    if (lRes.ok) setLive(await lRes.json());
  }, [id]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  const m = live?.metrics;
  const diskPct = m?.disks?.[0]?.usedPercent ?? null;
  const net = m?.network?.interfaces?.[0];
  const top = live?.processes?.[0];
  const cpuH = healthFromPercent(m?.cpu?.utilizationPercent);
  const memH = healthFromPercent(m?.memory?.usedPercent);
  const diskH = healthFromPercent(diskPct);

  return (
    <DeviceShell deviceId={id} deviceName={meta?.name}>
      <div
        className="panel"
        style={{ padding: "1.25rem", marginBottom: "1rem", borderColor: "var(--border-strong)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <div>
            <div className="mono" style={{ color: "var(--accent)", fontSize: "0.75rem", letterSpacing: "0.16em" }}>
              DIGITAL TWIN
            </div>
            <h1 className="mono" style={{ margin: "0.35rem 0 0", fontSize: "1.6rem" }}>
              {meta?.name || "…"}
            </h1>
            <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.35rem" }}>
              {meta?.osVersion || "—"}
            </div>
          </div>
          <StatusDot status={live?.status || meta?.status || "UNKNOWN"} />
        </div>
        {(live?.status === "OFFLINE" || meta?.status === "OFFLINE") && (
          <div className="mono" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            Last seen: {meta?.lastSeenLabel}
            <br />
            Reason: {meta?.lastKnownReason || "Connection lost — exact reason unknown."}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
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
        <MetricTile label="GPU" value={fmtPercent(m?.gpu?.utilizationPercent ?? null)} hint={m?.gpu?.name || "UNAVAILABLE"} />
        <MetricTile label="DISK" value={fmtPercent(diskPct)} hint={m?.disks?.[0]?.mount} />
        <MetricTile label="NETWORK" value={`${mbps(net?.downloadBytesPerSec)} ↓`} hint={`${mbps(net?.uploadBytesPerSec)} ↑`} />
        <MetricTile label="TEMP" value={m?.cpu?.temperatureC != null ? `${Math.round(m.cpu.temperatureC)}°C` : "UNAVAILABLE"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
        <div className="panel" style={{ padding: "1.1rem" }}>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.12em" }}>SYSTEM HEALTH</div>
          <HealthRow name="CPU" {...cpuH} />
          <HealthRow name="MEMORY" {...memH} />
          <HealthRow name="STORAGE" {...diskH} />
          <HealthRow name="NETWORK" label={m?.network?.internetConnected ? "NORMAL" : "CHECK"} icon={m?.network?.internetConnected ? "✓" : "⚠"} />
        </div>
        <div className="panel" style={{ padding: "1.1rem" }}>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.12em" }}>TOP PROCESS</div>
          {top ? (
            <div style={{ marginTop: "0.75rem" }}>
              <div className="mono" style={{ fontSize: "1.15rem" }}>{top.name}</div>
              <div className="mono" style={{ color: "var(--text-muted)", marginTop: "0.4rem", fontSize: "0.85rem" }}>
                CPU {top.cpuPercent ?? "—"}% · RAM {fmtBytes(top.memoryBytes)} · PID {top.pid}
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-dim)" }}>No process data yet.</p>
          )}
        </div>
        <div className="panel" style={{ padding: "1.1rem" }}>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.12em" }}>AGENT</div>
          {live?.agent ? (
            <div className="mono" style={{ marginTop: "0.75rem", fontSize: "0.85rem", lineHeight: 1.8, color: "var(--text-muted)" }}>
              Version {live.agent.agentVersion}
              <br />
              Status {live.agent.connected ? "Connected" : "Disconnected"}
              <br />
              Telemetry {live.agent.telemetryActive ? "Active" : "Idle"}
              <br />
              Queue {live.agent.queueSize}
            </div>
          ) : (
            <p style={{ color: "var(--text-dim)" }}>Awaiting first heartbeat.</p>
          )}
        </div>
      </div>
    </DeviceShell>
  );
}

function HealthRow({ name, label, icon }: { name: string; label: string; icon: string }) {
  return (
    <div className="mono" style={{ display: "flex", justifyContent: "space-between", marginTop: "0.65rem", fontSize: "0.85rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.45rem" }}>
      <span style={{ color: "var(--text-muted)" }}>{name}</span>
      <span>
        {label} <span style={{ color: "var(--accent)" }}>{icon}</span>
      </span>
    </div>
  );
}
