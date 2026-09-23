"use client";

import { useState } from "react";
import { DevicePageFrame, PageSkeleton, useCachedJson, useDeviceId } from "@/hooks/useDevice";

type TimelineEv = { id: string; title: string; occurredAt: string; type: string; message: string };

export default function TimelinePage() {
  const id = useDeviceId();
  const [selected, setSelected] = useState<string | null>(null);
  const { data: events, loading } = useCachedJson<TimelineEv[]>(
    `${id}:timeline`,
    `/api/devices/${id}/events?limit=80`,
    {
      intervalMs: 15000,
      pick: (json) => ((json as { events?: TimelineEv[] }).events || []) as TimelineEv[],
    }
  );

  const list = events || [];
  const active = list.find((e) => e.id === selected);

  return (
    <DevicePageFrame title="COMPUTER TIMELINE">
      {loading && !list.length ? <PageSkeleton rows={3} /> : null}
      {!(!list.length && loading) && (
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(240px,320px)", gap: "0.75rem" }} className="timeline-grid">
        <div className="panel" style={{ padding: "1rem" }}>
          <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
            TODAY / RECENT
          </div>
          <div style={{ position: "relative", paddingLeft: "1rem", borderLeft: "1px solid var(--border-strong)" }}>
            {list.map((e) => (
              <button
                key={e.id}
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelected(e.id)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: selected === e.id ? "var(--accent-glow)" : "transparent",
                  marginBottom: "0.25rem",
                  minHeight: "auto",
                  padding: "0.55rem 0.65rem",
                }}
              >
                <span className="mono" style={{ color: "var(--accent)", fontSize: "0.75rem" }}>
                  {new Date(e.occurredAt).toLocaleTimeString()}
                </span>
                <div className="mono" style={{ fontSize: "0.9rem" }}>{e.title}</div>
              </button>
            ))}
            {!list.length && <p style={{ color: "var(--text-dim)" }}>Timeline empty. Waiting for events.</p>}
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
      )}
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
