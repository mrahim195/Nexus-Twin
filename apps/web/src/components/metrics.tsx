export function StatusDot({ status }: { status: string }) {
  const online = status === "ONLINE" || status === "IDLE";
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        color: online ? "var(--accent)" : "var(--text-dim)",
        letterSpacing: "0.08em",
        fontSize: "0.85rem",
      }}
    >
      <span
        className={online ? "pulse-online" : undefined}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: online ? "var(--accent)" : "var(--text-dim)",
          boxShadow: online ? "0 0 10px var(--accent)" : "none",
        }}
      />
      {online ? "●" : "○"} {status}
    </span>
  );
}

export function MetricTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div
      className="panel"
      style={{
        padding: "1rem",
        minWidth: 0,
      }}
    >
      <div
        className="mono"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: "1.75rem",
          fontWeight: 600,
          color: "var(--text)",
        }}
      >
        {value}
      </div>
      {hint && (
        <div className="mono" style={{ color: "var(--text-dim)", fontSize: "0.75rem", marginTop: "0.35rem" }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function fmtPercent(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "UNAVAILABLE";
  return `${Math.round(v)}%`;
}

export function fmtBytes(v: number | null | undefined): string {
  if (v === null || v === undefined) return "UNAVAILABLE";
  const gb = v / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = v / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

export function healthFromPercent(v: number | null | undefined): {
  label: string;
  icon: string;
} {
  if (v === null || v === undefined) return { label: "UNKNOWN", icon: "?" };
  if (v >= 90) return { label: "HIGH", icon: "⚠" };
  if (v >= 75) return { label: "ELEVATED", icon: "!" };
  return { label: "NORMAL", icon: "✓" };
}
