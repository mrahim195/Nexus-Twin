import { AppShell } from "@/components/AppShell";

export default function PrivacyPage() {
  return (
    <AppShell title="PRIVACY">
      <article className="panel" style={{ padding: "1.5rem", maxWidth: 720 }}>
        <h1 className="mono" style={{ marginTop: 0 }}>
          Privacy
        </h1>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
          NEXUS//TWIN is an observability product, not spyware. Default telemetry is limited to
          legitimate system monitoring: hardware identity, resource metrics, process names and
          usage, and agent-detectable system events.
        </p>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
          We do not collect keystrokes, passwords, private documents, screenshots, microphone,
          webcam, browser passwords, or message contents.
        </p>
        <p style={{ color: "var(--text-dim)", fontSize: "0.85rem" }}>
          Full policy: see <code>apps/web/privacy.md</code> in the repository.
        </p>
      </article>
    </AppShell>
  );
}
