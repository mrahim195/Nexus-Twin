"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/devices", label: "Devices" },
  { href: "/privacy", label: "Privacy" },
];

export function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-elevated)",
          padding: "0.85rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            className="btn btn-ghost"
            type="button"
            style={{ padding: "0.4rem 0.6rem", display: "none" }}
            onClick={() => setOpen((v) => !v)}
            id="nav-toggle"
          >
            MENU
          </button>
          <Link href="/devices" className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>
            NEXUS//TWIN
          </Link>
          {title && (
            <span className="mono" style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
              / {title}
            </span>
          )}
        </div>
        <nav style={{ display: "flex", gap: "1rem" }} className="desktop-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mono"
              style={{
                color:
                  pathname.startsWith(item.href)
                    ? "var(--accent)"
                    : "var(--text-muted)",
                fontSize: "0.8rem",
                letterSpacing: "0.06em",
              }}
            >
              {item.label.toUpperCase()}
            </Link>
          ))}
        </nav>
      </header>
      {open && (
        <div
          className="panel"
          style={{ margin: "0.5rem", padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
      <div style={{ flex: 1, padding: "1.25rem", maxWidth: 1200, width: "100%", margin: "0 auto" }}>
        {children}
      </div>
      <style jsx global>{`
        @media (max-width: 720px) {
          #nav-toggle {
            display: inline-flex !important;
          }
          .desktop-nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
