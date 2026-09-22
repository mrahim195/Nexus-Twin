import { log } from "../logger.js";
import type { AgentCredentials } from "../storage/queue.js";
import { OfflineQueue } from "../storage/queue.js";

export class ApiClient {
  constructor(
    private creds: AgentCredentials,
    private queue: OfflineQueue
  ) {}

  updateCredentials(creds: AgentCredentials): void {
    this.creds = creds;
  }

  private headers(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.creds.deviceToken}`,
      "X-Device-Id": this.creds.deviceId,
    };
  }

  async post(path: string, body: unknown, queueKind?: "telemetry" | "processes" | "events"): Promise<boolean> {
    const url = `${this.creds.apiUrl.replace(/\/$/, "")}${path}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        log("WARN", `Cloud temporarily unavailable (${res.status})`, text.slice(0, 200));
        if (queueKind) {
          await this.queue.enqueue({ kind: queueKind, body });
        }
        return false;
      }
      return true;
    } catch (err) {
      log("WARN", "Cloud temporarily unavailable", err instanceof Error ? err.message : err);
      if (queueKind) {
        await this.queue.enqueue({ kind: queueKind, body });
      }
      return false;
    }
  }

  async heartbeat(payload: unknown): Promise<boolean> {
    return this.post("/api/devices/heartbeat", payload);
  }

  async telemetry(payload: unknown): Promise<boolean> {
    return this.post("/api/telemetry", payload, "telemetry");
  }

  async processes(payload: unknown): Promise<boolean> {
    return this.post("/api/devices/processes", payload, "processes");
  }

  async events(payload: unknown): Promise<boolean> {
    return this.post("/api/events", payload, "events");
  }

  async agentStatus(payload: unknown): Promise<boolean> {
    return this.post("/api/devices/agent-status", payload);
  }

  async register(pairingCode: string, identity: Record<string, unknown>): Promise<{
    deviceId: string;
    deviceToken: string;
  } | null> {
    const url = `${this.creds.apiUrl.replace(/\/$/, "")}/api/devices/register`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pairingCode, ...identity }),
      });
      if (!res.ok) {
        log("ERROR", "Device registration failed", await res.text());
        return null;
      }
      return (await res.json()) as { deviceId: string; deviceToken: string };
    } catch (err) {
      log("ERROR", "Device registration error", err);
      return null;
    }
  }

  async flushQueue(): Promise<void> {
    const items = await this.queue.drain();
    for (const item of items) {
      if (item.kind === "telemetry") await this.telemetry(item.body);
      else if (item.kind === "processes") await this.processes(item.body);
      else if (item.kind === "events") await this.events(item.body);
    }
  }
}
