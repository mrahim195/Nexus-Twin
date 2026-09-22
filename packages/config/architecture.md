# NEXUS//TWIN Architecture

## Control plane vs agent plane

| Plane | Runs where | Responsibilities |
|-------|------------|------------------|
| Control | Vercel / Next.js + MongoDB | Auth, devices, ingestion, history, AI, UI |
| Agent | User PC (Electron/Node) | Collect, queue, heartbeat, outbound sync |

The cloud **never** opens a connection into the machine. Presence is inferred from heartbeats.

## Data flow

```text
OS metrics
  → collectors (interval)
  → scheduler batch
  → offline queue (bounded)
  → HTTPS transport (device token)
  → Next.js route handlers
  → Zod validate
  → ownership check
  → MongoDB write
  → dashboard read / poll / SSE
```

## MongoDB collections (logical)

```text
users
devices
device_credentials
pairing_codes
metric_snapshots
process_snapshots
events
anomalies
ai_diagnostics
agent_status
```

## Online detection

```text
ONLINE  ⇔  now - lastHeartbeatAt < OFFLINE_TIMEOUT_SEC
OFFLINE ⇔  otherwise
```

If only heartbeat stops: UI says *Connection lost — exact reason unknown.*  
If agent sent `sleep` / `shutdown` event: show that reason.

## Retention strategy

| Age | Strategy |
|-----|----------|
| 0–24h | Raw snapshots (~5–30s cadence) |
| 1–7d | Downsample to 1-minute aggregates |
| 7–30d | Downsample to 5-minute aggregates |
| >30d | Keep events + daily rollups; drop raw metrics |

(Aggregation jobs land in later milestones; constants live in `retention.ts`.)

## Security model

1. User session JWT/cookie for dashboard APIs  
2. Per-device bearer token for agent APIs  
3. Every device-scoped query filters `ownerId` / device ownership  
4. Pairing codes are short-lived and single-use  

## Related documentation

- [Root](../../NEXUS-TWIN.md)
- [Database](../database/database.md)
- [API Contract](../../apps/web/api-contract.md)
- [Config](config.md)
