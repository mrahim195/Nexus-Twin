import { createHash, randomBytes } from "node:crypto";
import { INTERVALS } from "@nexus-twin/config";
import type { DeviceStatus } from "@nexus-twin/types";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateDeviceToken(): string {
  return randomBytes(32).toString("base64url");
}

export function generatePairingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    out += alphabet[bytes[i]! % alphabet.length];
    if (i === 2) out += "-";
  }
  return out;
}

export function deriveDeviceStatus(
  lastHeartbeatAt: Date | null | undefined,
  statusHint?: string | null,
  offlineTimeoutSec = INTERVALS.offlineTimeoutSec
): DeviceStatus {
  if (!lastHeartbeatAt) return "UNKNOWN";
  const ageMs = Date.now() - new Date(lastHeartbeatAt).getTime();
  if (ageMs > offlineTimeoutSec * 1000) return "OFFLINE";
  if (statusHint === "SLEEPING") return "SLEEPING";
  if (statusHint === "IDLE") return "IDLE";
  return "ONLINE";
}

export function formatLastSeen(date: Date | null | undefined): string {
  if (!date) return "Never";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
