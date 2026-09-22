"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusDot } from "@/components/metrics";

interface DeviceRow {
  id: string;
  name: string;
  hostname: string;
  platform: string;
  osVersion: string;
  status: string;
  lastSeenLabel: string;
  lastKnownReason: string | null;
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [pairing, setPairing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/devices");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const data = await res.json();
    setDevices(data.devices || []);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 10000);
    return () => clearInterval(t);
  }, [load]);

  async function createPairing() {
    setError(null);
    const res = await fetch("/api/devices/pairing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      setError("Could not create pairing code");
      return;
    }
    const data = await res.json();
    setPairing(data.code);
  }

  return (
    <AppShell title="DEVICES">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 className="mono" style={{ margin: 0, fontSize: "1.5rem" }}>
            MY DEVICES
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.4rem" }}>
            Select a computer to open its digital twin. Page auto-refreshes every 10s —
            do <strong>not</strong> click ADD DEVICE again while waiting.
          </p>
        </div>
        <button className="btn" type="button" onClick={() => void createPairing()}>
          ADD DEVICE
        </button>
      </div>

      {pairing && (
        <div className="panel" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
            PAIRING CODE · EXPIRES IN 15 MIN · DO NOT REGENERATE
          </div>
          <div className="mono" style={{ fontSize: "2rem", margin: "0.5rem 0", color: "var(--accent)" }}>
            {pairing}
          </div>
          <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.9rem" }}>
            1. Put this exact code in <code className="mono">apps/agent/.env</code> as{" "}
            <code className="mono">NEXUS_PAIRING_CODE={pairing}</code>
            <br />
            2. Restart only the agent
            <br />
            3. Wait — this list updates automatically. Reloading the page is fine; clicking ADD
            DEVICE again creates a different code.
          </p>
        </div>
      )}

      {error && <p style={{ color: "var(--error)" }}>{error}</p>}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {devices.length === 0 && (
          <div className="panel" style={{ padding: "1.5rem", color: "var(--text-dim)" }}>
            No devices yet. Generate a pairing code to connect the local agent.
          </div>
        )}
        {devices.map((d) => (
          <Link
            key={d.id}
            href={`/devices/${d.id}`}
            className="panel"
            style={{
              padding: "1.1rem 1.25rem",
              display: "block",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <div className="mono" style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  {d.name}
                </div>
                <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                  {d.osVersion} · {d.platform}
                </div>
              </div>
              <StatusDot status={d.status} />
            </div>
            {d.status === "OFFLINE" && (
              <div className="mono" style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.75rem" }}>
                Last seen: {d.lastSeenLabel}
                <br />
                {d.lastKnownReason}
              </div>
            )}
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
