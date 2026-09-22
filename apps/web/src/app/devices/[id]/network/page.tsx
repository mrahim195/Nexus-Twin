"use client";

import { DevicePageFrame, useDeviceId, useLive } from "@/hooks/useDevice";

export default function NetworkPage() {
  const id = useDeviceId();
  const { live } = useLive(id);
  const network = live?.metrics as {
    network?: {
      internetConnected: boolean | null;
      interfaces: Array<{
        name: string;
        connected: boolean | null;
        ipv4: string[] | null;
        downloadBytesPerSec: number | null;
        uploadBytesPerSec: number | null;
        bytesSent: number | null;
        bytesReceived: number | null;
      }>;
    };
  } | null | undefined;

  const ifaces = network?.network?.interfaces || [];
  const apps = ((live?.processes as Array<{ name: string }>) || [])
    .slice(0, 6)
    .map((p) => p.name.replace(/\.(exe|app)$/i, ""));

  return (
    <DevicePageFrame title="NETWORK">
      <div className="panel" style={{ padding: "1.1rem", marginBottom: "1rem" }}>
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
          CONNECTIVITY
        </div>
        <div className="mono" style={{ marginTop: "0.5rem", fontSize: "1.1rem" }}>
          Internet:{" "}
          {network?.network?.internetConnected == null
            ? "UNAVAILABLE"
            : network.network.internetConnected
              ? "CONNECTED"
              : "DISCONNECTED"}
        </div>
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
          Metadata only — no packet interception in this version.
        </p>
      </div>

      <div className="panel" style={{ padding: "1.1rem", marginBottom: "1rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
{`        YOUR COMPUTER
              │
    ┌─────────┼──────────┐
${apps.slice(0, 3).map((a) => `  ${a.padEnd(12)}`).join("") || "  (apps pending)"}
`}
      </div>

      <div style={{ display: "grid", gap: "0.55rem" }}>
        {ifaces.map((i) => (
          <div key={i.name} className="panel" style={{ padding: "0.9rem 1rem" }}>
            <div className="mono" style={{ fontWeight: 600 }}>{i.name}</div>
            <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              {i.connected ? "UP" : "DOWN"} · IPv4 {(i.ipv4 || []).join(", ") || "UNAVAILABLE"}
              <br />
              ↓ {i.downloadBytesPerSec != null ? `${(i.downloadBytesPerSec / 1024).toFixed(1)} KB/s` : "UNAVAILABLE"}
              {" · "}
              ↑ {i.uploadBytesPerSec != null ? `${(i.uploadBytesPerSec / 1024).toFixed(1)} KB/s` : "UNAVAILABLE"}
            </div>
          </div>
        ))}
        {!ifaces.length && (
          <div className="panel" style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
            No network interfaces reported yet.
          </div>
        )}
      </div>
    </DevicePageFrame>
  );
}
