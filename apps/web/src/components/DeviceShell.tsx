"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const base = `/devices/${deviceId}`;

  // Prefetch all sections so clicks open instantly (dev compile still first-hit only)
  useEffect(() => {
    for (const s of SECTIONS) {
      const href = s.slug ? `${base}/${s.slug}` : base;
      try {
        router.prefetch(href);
      } catch {
        /* ignore */
      }
    }
  }, [base, router]);

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Themed scrollbar: reveal while scrolling, hide when idle
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;

    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      el.classList.add("is-scrolling");
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        el.classList.remove("is-scrolling");
      }, 900);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (hideTimer) clearTimeout(hideTimer);
      el.classList.remove("is-scrolling");
    };
  }, []);

  // Escape + scroll lock while overlay is open (mobile/tablet)
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);

    const mq = window.matchMedia("(max-width: 1023px)");
    const prevOverflow = document.body.style.overflow;
    if (mq.matches) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="device-shell">
      <header className="device-header">
        <div className="device-header-left">
          <button
            type="button"
            className="btn btn-ghost device-nav-toggle"
            aria-expanded={open}
            aria-controls="device-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "CLOSE" : "MENU"}
          </button>
          <Link
            href="/devices"
            className="mono device-brand"
            style={{ color: "var(--text)", fontWeight: 600, textDecoration: "none" }}
          >
            NEXUS//TWIN
          </Link>
          <span className="mono device-subtitle" style={{ color: "var(--text-dim)" }}>
            / {deviceName || deviceId.slice(0, 8)}
          </span>
        </div>
        <Link
          href={`${base}/ai`}
          className="btn device-ask"
          style={{ textDecoration: "none" }}
        >
          ASK AI
        </Link>
      </header>

      {open && (
        <button
          type="button"
          className="device-nav-backdrop"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="device-layout">
        <aside
          id="device-nav"
          ref={navRef}
          className={`panel device-nav${open ? " is-open" : ""}`}
        >
          <div className="device-nav-head">
            <span className="mono" style={{ color: "var(--text-muted)", fontSize: "0.7rem", letterSpacing: "0.1em" }}>
              NAVIGATION
            </span>
            <button
              type="button"
              className="btn btn-ghost device-nav-close"
              onClick={() => setOpen(false)}
            >
              CLOSE
            </button>
          </div>
          <nav className="device-nav-list">
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
                  onClick={() => setOpen(false)}
                  className="mono device-nav-link"
                  style={{
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    background: active ? "var(--accent-glow)" : "transparent",
                  }}
                >
                  {s.label.toUpperCase()}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="device-main">{children}</main>
      </div>

      <style jsx global>{`
        .device-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .device-header {
          border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .device-header-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
          flex: 1;
        }

        .device-brand {
          white-space: nowrap;
        }

        .device-subtitle {
          font-size: 0.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .device-ask {
          padding: 0.45rem 0.85rem;
          min-height: auto;
          flex-shrink: 0;
        }

        .device-nav-toggle {
          padding: 0.35rem 0.55rem;
          min-height: auto;
          flex-shrink: 0;
        }

        .device-layout {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr;
          min-height: 0;
          min-width: 0;
        }

        .device-main {
          padding: 1rem;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          min-width: 0;
        }

        .device-nav-list {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .device-nav-link {
          padding: 0.55rem 0.65rem;
          font-size: 0.78rem;
          letter-spacing: 0.04em;
          text-decoration: none;
          min-height: var(--tap);
          display: flex;
          align-items: center;
        }

        /* Theme-matched auto-hide scrollbar (sidebar only) */
        .device-nav {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }

        .device-nav:hover,
        .device-nav.is-scrolling {
          scrollbar-color: var(--border-strong) transparent;
        }

        .device-nav::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .device-nav::-webkit-scrollbar-track {
          background: transparent;
        }

        .device-nav::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 999px;
        }

        .device-nav:hover::-webkit-scrollbar-thumb,
        .device-nav.is-scrolling::-webkit-scrollbar-thumb {
          background: var(--border-strong);
        }

        .device-nav:hover::-webkit-scrollbar-thumb:hover,
        .device-nav.is-scrolling::-webkit-scrollbar-thumb:hover {
          background: var(--accent-dim);
        }

        .device-nav-head {
          display: none;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.65rem;
          border-bottom: 1px solid var(--border);
        }

        .device-nav-close {
          display: none;
          padding: 0.35rem 0.55rem;
          min-height: auto;
        }

        .device-nav-backdrop {
          display: none;
        }

        /* Phones + tablets: left overlay drawer — content does not shift */
        @media (max-width: 1023px) {
          .device-nav-toggle {
            display: inline-flex !important;
          }

          .device-nav {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: min(300px, 88vw);
            z-index: 50;
            margin: 0 !important;
            padding: 1rem !important;
            border-radius: 0;
            border-right: 1px solid var(--border);
            background: var(--bg-elevated);
            height: 100% !important;
            max-height: 100dvh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            transform: translateX(-105%);
            transition: transform 0.22s ease;
            pointer-events: none;
            display: block !important;
          }

          .device-nav.is-open {
            transform: translateX(0);
            pointer-events: auto;
          }

          .device-nav-backdrop {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 45;
            margin: 0;
            padding: 0;
            border: none;
            background: rgba(0, 0, 0, 0.55);
            cursor: pointer;
          }

          .device-nav-head {
            display: flex !important;
          }

          .device-nav-close {
            display: inline-flex !important;
          }
        }

        /* Desktop: persistent sidebar beside content */
        @media (min-width: 1024px) {
          .device-layout {
            grid-template-columns: 220px 1fr;
          }

          .device-nav {
            display: block !important;
            position: sticky;
            top: 0.75rem;
            align-self: start;
            margin: 0.75rem;
            padding: 0.75rem;
            height: fit-content;
            max-height: calc(100vh - 1.5rem);
            overflow-y: auto;
            transform: none !important;
            pointer-events: auto !important;
            z-index: 1;
          }

          .device-nav-toggle,
          .device-nav-backdrop,
          .device-nav-head,
          .device-nav-close {
            display: none !important;
          }

          .device-main {
            padding: 1.25rem 1.5rem;
          }
        }

        /* Narrow phones */
        @media (max-width: 480px) {
          .device-header {
            padding: 0.65rem 0.75rem;
          }

          .device-subtitle {
            display: none;
          }

          .device-main {
            padding: 0.75rem;
          }

          .device-ask {
            padding: 0.4rem 0.65rem;
            font-size: 0.75rem;
          }
        }

        /* Tablets in landscape / mid widths */
        @media (min-width: 768px) and (max-width: 1023px) {
          .device-main {
            padding: 1.1rem 1.25rem;
          }

          .device-nav {
            width: min(320px, 70vw);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .device-nav {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
