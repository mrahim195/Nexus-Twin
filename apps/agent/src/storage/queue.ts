import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { QUEUE } from "@nexus-twin/config";

export interface AgentCredentials {
  deviceId: string;
  deviceToken: string;
  apiUrl: string;
}

export function dataDir(): string {
  return path.join(os.homedir(), ".nexus-twin");
}

export async function ensureDataDir(): Promise<string> {
  const dir = dataDir();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function loadCredentials(): Promise<AgentCredentials | null> {
  try {
    const raw = await fs.readFile(
      path.join(dataDir(), "credentials.json"),
      "utf8"
    );
    const parsed = JSON.parse(raw) as AgentCredentials;
    if (!parsed.deviceId || !parsed.deviceToken || !parsed.apiUrl) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveCredentials(creds: AgentCredentials): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(
    path.join(dataDir(), "credentials.json"),
    JSON.stringify(creds, null, 2),
    { mode: 0o600 }
  );
}

export type QueuedPayload =
  | { kind: "telemetry"; body: unknown }
  | { kind: "processes"; body: unknown }
  | { kind: "events"; body: unknown };

export class OfflineQueue {
  private file: string;
  private items: QueuedPayload[] = [];

  constructor() {
    this.file = path.join(dataDir(), "offline-queue.json");
  }

  async load(): Promise<void> {
    await ensureDataDir();
    try {
      const raw = await fs.readFile(this.file, "utf8");
      this.items = JSON.parse(raw) as QueuedPayload[];
    } catch {
      this.items = [];
    }
  }

  size(): number {
    return this.items.length;
  }

  async enqueue(item: QueuedPayload): Promise<void> {
    this.items.push(item);
    while (this.items.length > QUEUE.maxItems) {
      this.items.shift();
    }
    await this.persist();
  }

  async drain(): Promise<QueuedPayload[]> {
    const copy = [...this.items];
    this.items = [];
    await this.persist();
    return copy;
  }

  private async persist(): Promise<void> {
    await ensureDataDir();
    const json = JSON.stringify(this.items);
    if (Buffer.byteLength(json) > QUEUE.maxBytes) {
      while (
        this.items.length > 0 &&
        Buffer.byteLength(JSON.stringify(this.items)) > QUEUE.maxBytes
      ) {
        this.items.shift();
      }
    }
    await fs.writeFile(this.file, JSON.stringify(this.items));
  }
}
