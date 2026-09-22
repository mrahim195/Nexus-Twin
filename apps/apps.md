# NEXUS//TWIN Applications

## What this folder is responsible for

Runnable products: the **web control plane** and the **local agent observability plane**.

## Why it exists

Separates deployable apps from shared libraries under `packages/`.

## Internal structure

```text
apps/
├── apps.md          ← this file
├── web/             Next.js dashboard + API routes
└── agent/           Electron/Node telemetry agent
```

## Important files

| Path | Role |
|------|------|
| [web/web.md](web/web.md) | Dashboard + serverless APIs |
| [agent/agent.md](agent/agent.md) | Local collectors + transport |

## Dependencies

- `@nexus-twin/types`, `@nexus-twin/validation`, `@nexus-twin/config`
- Web also uses `@nexus-twin/database` (MongoDB)

## Interfaces

- Agent → Web: HTTPS JSON (`/api/devices/*`, `/api/telemetry`, `/api/events`)
- Web → MongoDB: via `@nexus-twin/database`

## Inputs / Outputs

| App | Inputs | Outputs |
|-----|--------|---------|
| web | Browser sessions, agent HTTPS | HTML/JSON, Mongo writes |
| agent | OS metrics | Outbound telemetry + heartbeats |

## Communication

```text
agent ──HTTPS──► web API ──► MongoDB
user  ──HTTPS──► web UI  ──► MongoDB (read)
```

## Conventions

- No inbound connections to the agent
- Shared types only from `@nexus-twin/types` — never duplicate interfaces

## Related documentation

- [Root](../NEXUS-TWIN.md)
- [Packages](../packages/packages.md)
- [API Contract](web/api-contract.md)
- [Architecture](../packages/config/architecture.md)
