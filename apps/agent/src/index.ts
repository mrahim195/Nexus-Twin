import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCT, THRESHOLDS } from "@nexus-twin/config";
import {
  collectMetricSnapshot,
  collectOsInfo,
  collectProcessSnapshot,
  aggregateApplications,
} from "./collectors/index.js";
import { log } from "./logger.js";
import { Scheduler, resolveIntervals } from "./scheduler/scheduler.js";
import {
  loadCredentials,
  saveCredentials,
  OfflineQueue,
  type AgentCredentials,
} from "./storage/queue.js";
import { ApiClient } from "./transport/client.js";

/** Load apps/agent/.env into process.env (Node does not do this automatically). */
function loadAgentEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
    break;
  }
}

loadAgentEnv();

type AlertKey = "high_cpu" | "high_memory" | "low_disk";
const alertCooldown = new Map<AlertKey, number>();

function mayEmit(key: AlertKey, cooldownMs = 5 * 60_000): boolean {
  const last = alertCooldown.get(key) || 0;
  if (Date.now() - last < cooldownMs) return false;
  alertCooldown.set(key, Date.now());
  return true;
}

async function resolveCredentials(): Promise<AgentCredentials> {
  const apiUrl = process.env.NEXUS_API_URL || "http://localhost:3000";
  const existing = await loadCredentials();
  if (existing) {
    return { ...existing, apiUrl: process.env.NEXUS_API_URL || existing.apiUrl };
  }

  const pairingCode = process.env.NEXUS_PAIRING_CODE;
  const deviceId = process.env.NEXUS_DEVICE_ID;
  const deviceToken = process.env.NEXUS_DEVICE_TOKEN;

  if (deviceId && deviceToken) {
    const creds = { deviceId, deviceToken, apiUrl };
    await saveCredentials(creds);
    return creds;
  }

  if (pairingCode) {
    const identity = await collectOsInfo();
    const tempClient = new ApiClient(
      { deviceId: "pending", deviceToken: "", apiUrl },
      new OfflineQueue()
    );
    const registered = await tempClient.register(pairingCode, {
      hostname: identity.hostname,
      name: identity.hostname,
      platform: identity.platform,
      osVersion: identity.osVersion,
      architecture: identity.architecture,
      agentVersion: PRODUCT.agentVersion,
    });
    if (!registered) {
      throw new Error("Pairing failed — check NEXUS_PAIRING_CODE");
    }
    const creds = {
      deviceId: registered.deviceId,
      deviceToken: registered.deviceToken,
      apiUrl,
    };
    await saveCredentials(creds);
    log("INFO", "Device authenticated / paired", { deviceId: creds.deviceId });
    return creds;
  }

  log("WARN", "No credentials — running in local print mode");
  return {
    deviceId: "local-dev",
    deviceToken: "",
    apiUrl,
  };
}

async function main(): Promise<void> {
  log("INFO", `${PRODUCT.name} Agent started`, { version: PRODUCT.agentVersion });

  const queue = new OfflineQueue();
  await queue.load();

  const creds = await resolveCredentials();
  const client = new ApiClient(creds, queue);
  const cloudEnabled = Boolean(creds.deviceToken) && creds.deviceId !== "local-dev";

  log("INFO", "Collectors initialized");
  const intervals = resolveIntervals();
  const scheduler = new Scheduler();
  scheduler.start();

  const identity = await collectOsInfo();
  log("INFO", "Host identity", identity);

  if (cloudEnabled) {
    await client.events({
      events: [
        {
          deviceId: creds.deviceId,
          type: "startup",
          severity: "info",
          title: "Agent started",
          message: `NEXUS//TWIN agent ${PRODUCT.agentVersion} started on ${identity.hostname}`,
          occurredAt: new Date().toISOString(),
          reportedByAgent: true,
        },
      ],
    });
  }

  const shutdown = async (signal: string) => {
    log("INFO", `Shutdown initiated (${signal})`);
    if (cloudEnabled) {
      await client.events({
        events: [
          {
            deviceId: creds.deviceId,
            type: "shutdown",
            severity: "info",
            title: "Agent stopping",
            message: `Graceful shutdown signal: ${signal}`,
            occurredAt: new Date().toISOString(),
            reportedByAgent: true,
          },
        ],
      });
    }
    scheduler.stop();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  scheduler.every(intervals.heartbeatSec, async () => {
    if (!cloudEnabled) {
      log("INFO", "Heartbeat (local)", { at: new Date().toISOString() });
      return;
    }
    const ok = await client.heartbeat({
      deviceId: creds.deviceId,
      agentVersion: PRODUCT.agentVersion,
      timestamp: new Date().toISOString(),
      statusHint: "ONLINE",
    });
    if (ok) {
      log("INFO", "Heartbeat sent");
      await client.flushQueue();
    }
  });

  scheduler.every(intervals.cpuRamSec, async () => {
    const { snapshot, collectors } = await collectMetricSnapshot(creds.deviceId);
    if (!cloudEnabled) {
      console.log(
        JSON.stringify(
          {
            type: "metric_snapshot",
            cpu: snapshot.cpu.utilizationPercent,
            ram: snapshot.memory.usedPercent,
            gpu: snapshot.gpu?.utilizationPercent ?? "UNAVAILABLE",
            collectors,
          },
          null,
          2
        )
      );
      return;
    }

    await client.telemetry({ snapshots: [snapshot] });
    await client.agentStatus({
      deviceId: creds.deviceId,
      agentVersion: PRODUCT.agentVersion,
      connected: true,
      telemetryActive: true,
      queueSize: queue.size(),
      collectors,
    });

    const events: Array<Record<string, unknown>> = [];
    const cpu = snapshot.cpu.utilizationPercent;
    const ram = snapshot.memory.usedPercent;
    const disk = snapshot.disks[0]?.usedPercent ?? null;

    if (cpu != null && cpu >= THRESHOLDS.cpuHighPercent && mayEmit("high_cpu")) {
      events.push({
        deviceId: creds.deviceId,
        type: "high_cpu",
        severity: "warning",
        title: "CPU high",
        message: `CPU reached ${cpu}%`,
        occurredAt: new Date().toISOString(),
        reportedByAgent: true,
      });
    }
    if (ram != null && ram >= THRESHOLDS.ramHighPercent && mayEmit("high_memory")) {
      events.push({
        deviceId: creds.deviceId,
        type: "high_memory",
        severity: "warning",
        title: "RAM high",
        message: `RAM reached ${ram}%`,
        occurredAt: new Date().toISOString(),
        reportedByAgent: true,
      });
    }
    if (disk != null && disk >= THRESHOLDS.diskHighPercent && mayEmit("low_disk")) {
      events.push({
        deviceId: creds.deviceId,
        type: "low_disk",
        severity: "warning",
        title: "Disk high",
        message: `Disk usage reached ${disk}%`,
        occurredAt: new Date().toISOString(),
        reportedByAgent: true,
      });
    }
    if (events.length) {
      await client.events({ events });
    }
  });

  scheduler.every(intervals.processSec, async () => {
    const { snapshot } = await collectProcessSnapshot(creds.deviceId);
    const apps = aggregateApplications(snapshot.processes);
    if (!cloudEnabled) {
      console.log(
        JSON.stringify(
          {
            type: "top_processes",
            top: snapshot.processes.slice(0, 5).map((p) => ({
              name: p.name,
              pid: p.pid,
              cpu: p.cpuPercent,
              ramBytes: p.memoryBytes,
            })),
            applications: apps.slice(0, 5),
          },
          null,
          2
        )
      );
      return;
    }
    await client.processes(snapshot);
  });

  log("INFO", "Scheduler running", intervals);
}

main().catch((err) => {
  log("ERROR", "Agent crashed", err);
  process.exit(1);
});
