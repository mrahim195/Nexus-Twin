/** System event timeline types */

export type EventType =
  | "boot"
  | "shutdown"
  | "startup"
  | "sleep"
  | "wake"
  | "application_started"
  | "application_stopped"
  | "application_crash"
  | "network_connected"
  | "network_disconnected"
  | "high_cpu"
  | "high_memory"
  | "low_disk"
  | "temperature_warning"
  | "unusual_network"
  | "agent_error"
  | "agent_update"
  | "heartbeat_lost"
  | "custom";

export type EventSeverity = "info" | "warning" | "error" | "critical";

export interface SystemEvent {
  id: string;
  deviceId: string;
  type: EventType;
  severity: EventSeverity;
  title: string;
  message: string;
  occurredAt: string;
  metadata?: Record<string, unknown>;
  reportedByAgent: boolean;
}
