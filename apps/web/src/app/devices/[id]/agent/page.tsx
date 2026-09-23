"use client";

import { DevicePageFrame, PageSkeleton, useDevice } from "@/hooks/useDevice";

export default function AgentPage() {
  const { live, meta, deviceId, loading } = useDevice();

  const agent = live?.agent as {
    agentVersion?: string;
    connected?: boolean;
    lastHeartbeatAt?: string | null;
    telemetryActive?: boolean;
    queueSize?: number;
    collectors?: Array<{ name: string; health: string; reason: string | null }>;
    lastSyncAt?: string | null;
  } | null;

  return (
    <DevicePageFrame title="AGENT STATUS">
      {loading && !live ? <PageSkeleton rows={3} /> : null}
      {!(!live && loading) && (
      <>
      <div className="panel" style={{ padding: "1.1rem" }}>
        <div className="mono" style={{ fontSize: "0.9rem", lineHeight: 2, color: "var(--text-muted)" }}>
          Device {meta?.name || deviceId}
          <br />
          Version {agent?.agentVersion || "UNAVAILABLE"}
          <br />
          Status {agent?.connected ? "Connected" : "Disconnected"}
          <br />
          Telemetry {agent?.telemetryActive ? "Active" : "Idle"}
          <br />
          Queue {agent?.queueSize ?? "UNAVAILABLE"}
          <br />
          Last heartbeat{" "}
          {agent?.lastHeartbeatAt
            ? new Date(agent.lastHeartbeatAt).toLocaleString()
            : "UNAVAILABLE"}
          <br />
          Last sync{" "}
          {agent?.lastSyncAt ? new Date(agent.lastSyncAt).toLocaleString() : "UNAVAILABLE"}
        </div>
      </div>

      <h2 className="mono" style={{ fontSize: "1rem", marginTop: "1.25rem" }}>
        COLLECTORS
      </h2>
      <div className="card-list">
        {(agent?.collectors || []).map((c) => (
          <div key={c.name} className="panel" style={{ padding: "0.85rem 1rem" }}>
            <div className="mono" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{c.name}</span>
              <span style={{ color: c.health === "OK" ? "var(--accent)" : "var(--warn)" }}>
                {c.health === "OK" ? "OK" : c.health}
              </span>
            </div>
            {c.reason && (
              <div className="mono" style={{ color: "var(--text-dim)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
                Reason: {c.reason}
              </div>
            )}
          </div>
        ))}
        {!agent?.collectors?.length && (
          <div className="panel" style={{ padding: "1rem", color: "var(--text-dim)" }}>
            Collector health will appear after the agent reports status.
          </div>
        )}
      </div>
      </>
      )}
    </DevicePageFrame>
  );
}
