"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email")),
      password: String(fd.get("password")),
    };
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }
    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });
    setLoading(false);
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/devices");
  }

  return (
    <main style={shell}>
      <form onSubmit={onSubmit} className="panel" style={card}>
        <h1 className="mono" style={{ margin: 0, fontSize: "1.4rem" }}>
          CREATE ACCESS
        </h1>
        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
          Your computers stay under your account only.
        </p>
        <label className="label" htmlFor="name">
          Name
        </label>
        <input className="input" id="name" name="name" />
        <div style={{ height: "0.85rem" }} />
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
            {typeof error === "string" ? error : "Invalid input"}
          </p>
        )}
        <button className="btn" type="submit" style={{ width: "100%", marginTop: "1.25rem" }} disabled={loading}>
          {loading ? "CREATING…" : "REGISTER"}
        </button>
        <p style={{ marginTop: "1rem", color: "var(--text-dim)", fontSize: "0.85rem" }}>
          Already registered? <Link href="/login">Sign in</Link>
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
