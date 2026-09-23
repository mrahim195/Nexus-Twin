# NEXUS//TWIN API Contract

Agent ↔ cloud contract. All agent payloads validated with Zod (`@nexus-twin/validation`).

## Auth

| Caller | Mechanism |
|--------|-----------|
| Dashboard user | Session cookie (NextAuth) |
| Agent | `Authorization: Bearer <deviceToken>` + `X-Device-Id` |

## Endpoints

| Method | Path | Caller | Purpose |
|--------|------|--------|---------|
| POST | `/api/auth/register` | User | Create account |
| POST | `/api/auth/[...nextauth]` | User | NextAuth |
| POST | `/api/devices/pairing` | User | Create short-lived pairing code |
| POST | `/api/devices/register` | Agent | Consume pairing code → device + token |
| POST | `/api/devices/heartbeat` | Agent | Presence |
| GET | `/api/devices` | User | List owned devices |
| GET | `/api/devices/:id` | User | Device detail |
| GET | `/api/devices/:id/live` | User | Latest metrics |
| GET | `/api/devices/:id/history` | User | Time-window history |
| GET | `/api/devices/:id/processes` | User | Latest processes |
| GET | `/api/devices/:id/events` | User | Events |
| POST | `/api/devices/processes` | Agent | Process snapshot ingest |
| POST | `/api/telemetry` | Agent | Metric batch ingest |
| POST | `/api/events` | Agent | Event batch ingest |
| POST | `/api/ai/diagnose` | User | Evidence package → Gemini structured diagnosis |
| POST | `/api/ai/analyze` | User | Alias of diagnose |
| GET | `/api/devices/:id/analytics` | User | Baselines + today vs yesterday |
| GET | `/api/devices/:id/anomalies` | User | Anomaly list (`?scan=1` to evaluate now) |
| POST | `/api/devices/agent-status` | Agent | Collector / queue health |

## AI provider

Uses **Google Gemini** (`GEMINI_API_KEY`, optional `GEMINI_API_KEY_2`… / `GEMINI_API_KEYS`). Quota errors rotate keys in a loop. If all keys fail or none are set, a deterministic evidence-based fallback still answers (no hallucinated inventing of metrics).

## Ownership

Changing a device id in a URL must never leak another user's data. Every user route loads the device and asserts `ownerId === session.user.id`.

## Related

- [Validation](../../packages/validation/validation.md)
- [Web](web.md)
- [Architecture](../../packages/config/architecture.md)
