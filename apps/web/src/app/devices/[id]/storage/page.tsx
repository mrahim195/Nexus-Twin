"use client";

import { fmtBytes, fmtPercent } from "@/components/metrics";
import { DevicePageFrame, PageSkeleton, useDevice } from "@/hooks/useDevice";

export default function StoragePage() {
  const { live, loading } = useDevice();
  const disks =
    (
      live?.metrics as {
        disks?: Array<{
          mount: string;
          filesystem: string | null;
          totalBytes: number | null;
          usedBytes: number | null;
          freeBytes: number | null;
          usedPercent: number | null;
        }>;
      } | null
    )?.disks || [];

  return (
    <DevicePageFrame title="STORAGE">
      {loading && !live ? <PageSkeleton rows={3} /> : null}
      {!(!live && loading) && (
      <>
      <p style={{ color: "var(--text-muted)", marginTop: 0 }}>
        Capacity metadata only. Directory analysis does not upload file contents.
      </p>
      <div className="card-list">
        {disks.map((d) => (
          <div key={d.mount} className="panel" style={{ padding: "1.1rem" }}>
            <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 600 }}>{d.mount}</div>
            <div className="mono" style={{ marginTop: "0.5rem", fontSize: "1.5rem" }}>
              {fmtPercent(d.usedPercent)}
            </div>
            <div className="mono" style={{ color: "var(--text-muted)", marginTop: "0.35rem", fontSize: "0.85rem" }}>
              USED {fmtBytes(d.usedBytes)} / {fmtBytes(d.totalBytes)} · FREE {fmtBytes(d.freeBytes)}
              <br />
              FS {d.filesystem || "UNAVAILABLE"}
            </div>
            <div style={{ marginTop: "0.85rem", height: 8, background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div style={{ height: "100%", width: `${Math.min(100, d.usedPercent ?? 0)}%`, background: "var(--accent-dim)" }} />
            </div>
          </div>
        ))}
        {!disks.length && (
          <div className="panel" style={{ padding: "1.25rem", color: "var(--text-dim)" }}>
            No disk telemetry yet.
          </div>
        )}
      </div>
      </>
      )}
    </DevicePageFrame>
  );
}
