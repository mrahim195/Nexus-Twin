"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email")),
      password: String(fd.get("password")),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials");
      return;
    }
    router.push("/devices");
  }

  return (
    <main style={shell}>
      <form onSubmit={onSubmit} className="panel" style={card}>
        <h1 className="mono" style={{ margin: 0, fontSize: "1.4rem" }}>
          NEXUS//TWIN
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Authenticate to access your digital twins.
        </p>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input className="input" id="email" name="email" type="email" required />
        <div style={{ height: "0.85rem" }} />
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
        />
        {error && (
          <p style={{ color: "var(--error)", fontFamily: "var(--font-mono)" }}>
            {error}
          </p>
        )}
        <button className="btn" type="submit" style={{ width: "100%", marginTop: "1.25rem" }} disabled={loading}>
          {loading ? "AUTHENTICATING…" : "SIGN IN"}
        </button>
        <p style={{ marginTop: "1rem", color: "var(--text-dim)", fontSize: "0.85rem" }}>
          No account? <Link href="/register">Create one</Link>
        </p>
      </form>
    </main>
  );
}

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: "1.5rem",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 400,
  padding: "1.75rem",
};
