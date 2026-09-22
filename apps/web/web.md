# NEXUS//TWIN Web Dashboard

## What this application is responsible for

Control plane UI + serverless API route handlers. Auth, device management, telemetry ingest, live views, and (later) AI diagnostics.

## Why it exists

Cloud visualization and management layer. It does **not** inspect the PC directly — it only reads what the agent uploaded to MongoDB.

## Internal structure

```text
apps/web/
├── web.md
├── api-contract.md
├── privacy.md
└── src/
    ├── app/           App Router pages + API routes
    ├── components/    UI primitives
    ├── lib/           auth, mongo, device helpers
    ├── hooks/
    └── styles/
```

## Navigation (architecture accommodates all; Milestone 4 implements core)

Overview · Live Monitor · Processes · Applications · Network · Storage · Events · Timeline · Analytics · Anomalies · AI Diagnostics · Devices · Settings · Agent

## Design language

Near-black + dark green · monospace telemetry · `● ONLINE` / `○ OFFLINE` · minimal glow · no purple SaaS look.

## Related documentation

- [API Contract](api-contract.md)
- [Privacy](privacy.md)
- [Gemini AI](gemini.md)
- [Web App Source](src/web-src.md)
- [Apps](../apps.md)
- [Database](../../packages/database/database.md)
- [Agent](../agent/agent.md)
