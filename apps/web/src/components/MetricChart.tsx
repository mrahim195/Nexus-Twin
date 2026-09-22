"use client";

export function MetricChart({
  points,
  color = "var(--accent)",
  height = 120,
  label,
}: {
  points: Array<{ t: string; v: number | null }>;
  color?: string;
  height?: number;
  label: string;
}) {
  const vals = points.map((p) => p.v).filter((v): v is number => v != null);
  const max = Math.max(100, ...vals, 1);
  const w = 600;
  const h = height;
  const usable = points.filter((p) => p.v != null);
  if (usable.length < 2) {
    return (
      <div className="panel" style={{ padding: "1rem" }}>
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
          {label}
        </div>
        <p style={{ color: "var(--text-dim)" }}>Not enough history yet.</p>
      </div>
    );
  }

  const coords = usable.map((p, i) => {
    const x = (i / (usable.length - 1)) * (w - 8) + 4;
    const y = h - 8 - ((p.v as number) / max) * (h - 16);
    return `${x},${y}`;
  });

  const last = usable[usable.length - 1]!;

  return (
    <div className="panel" style={{ padding: "1rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.5rem",
        }}
      >
        <div className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
          {label}
        </div>
        <div className="mono" style={{ color: "var(--accent)" }}>
          {last.v != null ? `${Math.round(last.v)}%` : "UNAVAILABLE"}
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={height} role="img" aria-label={label}>
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={coords.join(" ")}
        />
      </svg>
      <div className="mono" style={{ color: "var(--text-dim)", fontSize: "0.65rem" }}>
        {new Date(usable[0]!.t).toLocaleTimeString()} →{" "}
        {new Date(last.t).toLocaleTimeString()} · tap/hover values via live samples
      </div>
    </div>
  );
}
