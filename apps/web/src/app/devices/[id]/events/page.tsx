"use client";

import { DevicePageFrame, PageSkeleton, useCachedJson, useDeviceId } from "@/hooks/useDevice";

interface Ev {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  occurredAt: string;
  reportedByAgent: boolean;
}

export default function EventsPage() {
  const id = useDeviceId();
  const { data: events, loading } = useCachedJson<Ev[]>(
    `${id}:events`,
    `/api/devices/${id}/events?limit=100`,
    {
      intervalMs: 15000,
      pick: (json) => ((json as { events?: Ev[] }).events || []) as Ev[],
    }
  );

  const list = events || [];

  return (
    <DevicePageFrame title="EVENTS">
      {loading && !list.length ? <PageSkeleton rows={4} /> : null}
      <div className="card-list">
        {list.map((e) => (
          <div key={e.id} className="panel" style={{ padding: "0.85rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div className="mono" style={{ fontWeight: 600 }}>{e.title}</div>
              <div className="mono" style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>
                {new Date(e.occurredAt).toLocaleString()}
              </div>
            </div>
            <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: "0.35rem" }}>
              {e.type} · {e.severity}
              {!e.reportedByAgent ? " · inferred" : ""}
            </div>
            <p style={{ margin: "0.4rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>{e.message}</p>
          </div>
        ))}
        {!list.length && !loading && (
          <div className="panel" style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
            No events yet. Threshold crossings and agent lifecycle events will appear here.
          </div>
        )}
      </div>
    </DevicePageFrame>
  );
}
