export function StatusDot({ status }: { status: string }) {
  const online = status === "ONLINE" || status === "IDLE";
  return (
    <span
      className="mono status-dot"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
        color: online ? "var(--accent)" : "var(--text-dim)",
        letterSpacing: "0.06em",
        fontSize: "0.8rem",
        flexShrink: 0,
        maxWidth: "100%",
        whiteSpace: "nowrap",
      }}
    >
      <span
        className={online ? "pulse-online" : undefined}
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: online ? "var(--accent)" : "var(--text-dim)",
          boxShadow: online ? "0 0 10px var(--accent)" : "none",
        }}
      />
      {status}
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
  const long = value.length > 8;
  return (
    <div
      className="panel metric-tile"
      style={{
        padding: "0.85rem",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <div
        className="mono"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          marginBottom: "0.4rem",
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: long ? "0.95rem" : "1.5rem",
          fontWeight: 600,
          color: "var(--text)",
          lineHeight: 1.2,
          wordBreak: "break-word",
          overflowWrap: "anywhere",
        }}
        title={value}
      >
        {value}
      </div>
      {hint && (
        <div
          className="mono"
          style={{
            color: "var(--text-dim)",
            fontSize: "0.7rem",
            marginTop: "0.35rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={hint}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

export function fmtPercent(v: number | null | undefined): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  return `${Math.round(v)}%`;
}

export function fmtBytes(v: number | null | undefined): string {
  if (v === null || v === undefined) return "N/A";
  const gb = v / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = v / (1024 ** 2);
  return `${mb.toFixed(0)} MB`;
}

export function healthFromPercent(v: number | null | undefined): {
  label: string;
  icon: string;
} {
  if (v === null || v === undefined) return { label: "N/A", icon: "?" };
  if (v >= 90) return { label: "HIGH", icon: "!" };
  if (v >= 75) return { label: "ELEVATED", icon: "!" };
  return { label: "NORMAL", icon: "OK" };
}
