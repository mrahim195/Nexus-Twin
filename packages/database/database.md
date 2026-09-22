# NEXUS//TWIN Database (MongoDB)

## What this package is responsible for

MongoDB connection helper and Mongoose models for users, devices, credentials, telemetry, processes, events, anomalies, AI diagnostics, and agent status.

## Why it exists

Centralize schema and indexes. Replaces Supabase from the original sketch — **MongoDB is the system of record**.

## Internal structure

```text
packages/database/
├── database.md
└── src/
    ├── index.ts
    ├── client.ts
    └── models/
        ├── user.ts
        ├── device.ts
        ├── credential.ts
        ├── pairing.ts
        ├── metric-snapshot.ts
        ├── process-snapshot.ts
        ├── event.ts
        ├── anomaly.ts
        ├── ai-diagnostic.ts
        └── agent-status.ts
```

## Collections & indexes

| Collection | Key indexes |
|------------|-------------|
| devices | `ownerId`, `lastHeartbeatAt` |
| device_credentials | `deviceId`, `tokenHash` unique |
| pairing_codes | `code` unique, `expiresAt` TTL |
| metric_snapshots | `{ deviceId, collectedAt }` |
| process_snapshots | `{ deviceId, collectedAt }` |
| events | `{ deviceId, occurredAt }` |
| anomalies | `{ deviceId, detectedAt }` |

## Retention

See [architecture.md](../config/architecture.md). TTL indexes / downsampling jobs are planned for Milestone 8.

## Security note

This package is **server-only**. Never import it into the Electron renderer or browser bundles. Ownership filtering happens in API routes.

## Related documentation

- [Architecture](../config/architecture.md)
- [API Contract](../../apps/web/api-contract.md)
- [Packages](../packages.md)
