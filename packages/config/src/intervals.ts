/** Default collection & heartbeat intervals (seconds). Overridable via env. */

export const INTERVALS = {
  heartbeatSec: 20,
  offlineTimeoutSec: 60,
  cpuRamSec: 5,
  networkSec: 5,
  diskSec: 15,
  processSec: 20,
  gpuSec: 10,
  hardwareRefreshSec: 300,
} as const;

export const QUEUE = {
  /** Max queued telemetry payloads on disk during outage */
  maxItems: 500,
  /** Approx max bytes for local queue file */
  maxBytes: 25 * 1024 * 1024,
} as const;

export const PRODUCT = {
  name: "NEXUS//TWIN",
  tagline: "Your computer. Reconstructed in the cloud.",
  agentVersion: "0.1.0",
} as const;
