/** Agent self-health and collector status */

export type CollectorHealth = "OK" | "UNAVAILABLE" | "ERROR";

export interface CollectorStatus {
  name: string;
  health: CollectorHealth;
  reason: string | null;
}

export interface AgentHealth {
  deviceId: string;
  agentVersion: string;
  connected: boolean;
  lastHeartbeatAt: string | null;
  telemetryActive: boolean;
  queueSize: number;
  failedUploads: number;
  lastSyncAt: string | null;
  collectors: CollectorStatus[];
}
