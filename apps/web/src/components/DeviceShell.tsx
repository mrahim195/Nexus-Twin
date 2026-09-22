"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const SECTIONS = [
  { slug: "", label: "Overview" },
  { slug: "live", label: "Live Monitor" },
  { slug: "processes", label: "Processes" },
  { slug: "applications", label: "Applications" },
  { slug: "network", label: "Network" },
  { slug: "storage", label: "Storage" },
  { slug: "events", label: "Events" },
  { slug: "timeline", label: "Timeline" },
  { slug: "analytics", label: "Analytics" },
  { slug: "anomalies", label: "Anomalies" },
  { slug: "ai", label: "AI Diagnostics" },
  { slug: "agent", label: "Agent" },
] as const;

export function DeviceShell({
  deviceId,
  deviceName,
  children,
}: {
  deviceId: string;
  deviceName?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const base = `/devices/${deviceId}`;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: "0.35rem 0.55rem" }}
            onClick={() => setOpen((v) => !v)}
          >
            MENU
          </button>
          <Link href="/devices" className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>
            NEXUS//TWIN
          </Link>
          <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.8rem" }}>
            / {deviceName || deviceId.slice(0, 8)}
          </span>
        </div>
        <Link href={`${base}/ai`} className="btn" style={{ padding: "0.4rem 0.8rem" }}>
          ASK AI
        </Link>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: open ? "220px 1fr" : "1fr",
          flex: 1,
          minHeight: 0,
        }}
        className="device-layout"
      >
        <aside
          className="panel device-nav"
          style={{
            display: open ? "block" : "none",
            margin: "0.75rem",
            padding: "0.75rem",
            height: "fit-content",
            position: "sticky",
            top: "0.75rem",
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {SECTIONS.map((s) => {
              const href = s.slug ? `${base}/${s.slug}` : base;
              const active =
                s.slug === ""
                  ? pathname === base
                  : pathname.startsWith(`${base}/${s.slug}`);
              return (
                <Link
                  key={s.label}
                  href={href}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 900) {
                      setOpen(false);
                    }
                  }}
                  className="mono"
                  style={{
                    padding: "0.45rem 0.55rem",
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active ? "var(--accent-glow)" : "transparent",
                    fontSize: "0.78rem",
                    letterSpacing: "0.04em",
                    textDecoration: "none",
                  }}
                >
                  {s.label.toUpperCase()}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main style={{ padding: "1rem", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
          {children}
        </main>
      </div>

      <nav
        className="mobile-bottom"
        style={{
          display: "none",
          borderTop: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          padding: "0.5rem",
          gap: "0.25rem",
          overflowX: "auto",
        }}
      >
        {SECTIONS.slice(0, 6).map((s) => {
          const href = s.slug ? `${base}/${s.slug}` : base;
          return (
            <Link
              key={s.label}
              href={href}
              className="mono"
              style={{
                flex: "0 0 auto",
                padding: "0.4rem 0.55rem",
                color: "var(--text-muted)",
                fontSize: "0.65rem",
                textDecoration: "none",
              }}
            >
              {s.label.toUpperCase()}
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        @media (min-width: 900px) {
          .device-layout {
            grid-template-columns: 220px 1fr !important;
          }
          .device-nav {
            display: block !important;
          }
        }
        @media (max-width: 899px) {
          .mobile-bottom {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
