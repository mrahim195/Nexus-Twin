import Link from "next/link";
import { PRODUCT } from "@nexus-twin/config";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "2rem",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <p
        className="mono"
        style={{
          color: "var(--accent)",
          letterSpacing: "0.2em",
          fontSize: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        SYSTEM MONITOR // CONTROL PLANE
      </p>
      <h1
        className="mono"
        style={{
          fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
          fontWeight: 600,
          margin: 0,
          letterSpacing: "0.02em",
          textShadow: "0 0 40px var(--accent-glow)",
        }}
      >
        {PRODUCT.name}
      </h1>
      <p
        style={{
          marginTop: "1.25rem",
          maxWidth: 420,
          color: "var(--text-muted)",
          fontSize: "1.1rem",
          lineHeight: 1.5,
        }}
      >
        {PRODUCT.tagline}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "2.5rem", flexWrap: "wrap" }}>
        <Link className="btn" href="/login">
          SIGN IN
        </Link>
        <Link className="btn btn-ghost" href="/register">
          CREATE ACCOUNT
        </Link>
      </div>
      <p
        className="mono"
        style={{
          marginTop: "4rem",
          color: "var(--text-dim)",
          fontSize: "0.7rem",
          letterSpacing: "0.12em",
        }}
      >
        AGENT OBSERVES · CLOUD REMEMBERS · AI EXPLAINS
      </p>
    </main>
  );
}
