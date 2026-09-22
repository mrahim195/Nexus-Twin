/** Device identity and presence states for NEXUS//TWIN */

export type DeviceStatus =
  | "ONLINE"
  | "IDLE"
  | "SLEEPING"
  | "OFFLINE"
  | "UNKNOWN";

export type PlatformOs = "windows" | "macos" | "linux" | "unknown";

export interface DeviceInfo {
  id: string;
  ownerId: string;
  name: string;
  hostname: string;
  platform: PlatformOs;
  osVersion: string;
  architecture: string;
  agentVersion: string;
  status: DeviceStatus;
  lastHeartbeatAt: string | null;
  lastSeenAt: string | null;
  lastKnownReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceCredentialMeta {
  deviceId: string;
  tokenId: string;
  revokedAt: string | null;
  createdAt: string;
}

export interface PairingCodePayload {
  code: string;
  expiresAt: string;
}

export interface HeartbeatPayload {
  deviceId: string;
  agentVersion: string;
  timestamp: string;
  statusHint?: "ONLINE" | "IDLE" | "SLEEPING";
}
