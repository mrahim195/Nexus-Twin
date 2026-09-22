"use client";

import { useCallback, useEffect, useState } from "react";
import { DevicePageFrame, useDeviceId } from "@/hooks/useDevice";

export default function TimelinePage() {
  const id = useDeviceId();
  const [events, setEvents] = useState<
    Array<{ id: string; title: string; occurredAt: string; type: string; message: string }>
  >([]);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/devices/${id}/events?limit=80`);
    if (res.ok) {
      const data = await res.json();
      setEvents(data.events || []);
    }
  }, [id]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 12000);
    return () => clearInterval(t);
  }, [load]);

  const active = events.find((e) => e.id === selected);

  return (
    <DevicePageFrame title="COMPUTER TIMELINE">
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(240px,320px)", gap: "0.75rem" }} className="timeline-grid">
        <div className="panel" style={{ padding: "1rem" }}>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            TODAY / RECENT
          </div>
          <div style={{ position: "relative", paddingLeft: "1rem", borderLeft: "1px solid var(--border-strong)" }}>
            {events.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelected(e.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: selected === e.id ? "var(--accent-glow)" : "transparent",
                  border: "none",
                  color: "inherit",
                  padding: "0.55rem 0.65rem",
                  cursor: "pointer",
                  marginBottom: "0.25rem",
                }}
              >
                <span className="mono" style={{ color: "var(--accent)", fontSize: "0.75rem" }}>
                  {new Date(e.occurredAt).toLocaleTimeString()}
                </span>
                <div className="mono" style={{ fontSize: "0.9rem" }}>{e.title}</div>
              </button>
            ))}
            {!events.length && <p style={{ color: "var(--text-dim)" }}>Timeline empty — waiting for events.</p>}
          </div>
        </div>
        <div className="panel" style={{ padding: "1rem", height: "fit-content" }}>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
            DETAILS
          </div>
          {active ? (
            <>
              <h2 className="mono" style={{ fontSize: "1rem" }}>{active.title}</h2>
              <p className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                {active.type}
                <br />
                {new Date(active.occurredAt).toLocaleString()}
              </p>
              <p style={{ color: "var(--text-muted)" }}>{active.message}</p>
            </>
          ) : (
            <p style={{ color: "var(--text-dim)" }}>Select an event.</p>
          )}
        </div>
      </div>
      <style jsx global>{`
        @media (max-width: 800px) {
          .timeline-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </DevicePageFrame>
  );
}
