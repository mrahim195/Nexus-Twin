# NEXUS//TWIN

> **Your computer. Reconstructed in the cloud.**

Personal computer digital-twin platform: a local agent observes the machine; the cloud stores and visualizes telemetry; AI explains behavior from evidence — not guesses.

---

## Problem

Task Manager shows the present. When a machine felt slow at 7:30 PM, that moment is gone. NEXUS//TWIN keeps a living twin of each registered computer so you can inspect live state, history, anomalies, and ask grounded questions from any device.

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     CONTROL PLANE (Cloud)                    │
│  Next.js (Vercel)  ·  MongoDB  ·  Auth  ·  AI diagnostics   │
│  Device management · History · Realtime status · Analytics  │
└─────────────────────────────▲───────────────────────────────┘
                              │ outbound HTTPS only
┌─────────────────────────────┴───────────────────────────────┐
│              AGENT / OBSERVABILITY PLANE (Local)             │
│  Electron shell · Collectors · Heartbeat · Offline queue    │
│  Auto-start on boot · Never inbound from cloud              │
└─────────────────────────────────────────────────────────────┘
```

**Principle:** the cloud never dials into the PC. The agent pushes heartbeats and telemetry outbound.

**Database:** MongoDB (not Supabase). Auth and API live in the Next.js app; documents live in MongoDB with ownership checks on every request.

---

## Online / Offline Model

```text
Agent heartbeat ──► MongoDB lastHeartbeatAt
Dashboard: ONLINE if now - lastHeartbeat < timeout
           OFFLINE otherwise → "Connection lost — exact reason unknown."
            (unless agent reported sleep/shutdown event)
```

States: `ONLINE` · `IDLE` · `SLEEPING` · `OFFLINE` · `UNKNOWN`

---

## Feature List

| Area | Capability |
|------|------------|
| Twin overview | Live CPU/RAM/GPU/disk/net/temp + health |
| Live monitor | Realtime metrics without refresh |
| Processes / apps | Top processes, aggregated apps |
| Events / timeline | Boot, sleep, spikes, network, agent |
| Analytics | Baselines, anomalies, “what changed?” |
| AI diagnostics | Evidence package → structured diagnosis |
| Multi-device | Many computers per account |
| Agent health | Collectors, queue, sync status |
| Privacy | System metrics only — not spyware |

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Web | Next.js, TypeScript, Vercel |
| Agent | Node.js, TypeScript, Electron |
| DB | MongoDB |
| Validation | Zod (`@nexus-twin/validation`) |
| Shared types | `@nexus-twin/types` |
| Monorepo | pnpm + Turborepo |

---

## Repository Structure

```text
nexus/
├── NEXUS-TWIN.md          ← you are here
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .env.example
├── apps/
│   ├── apps.md
│   ├── web/               ← dashboard + API
│   └── agent/             ← local observability plane
├── packages/
│   ├── packages.md
│   ├── types/
│   ├── validation/
│   ├── database/          ← MongoDB client + models
│   └── config/
└── scripts/
    └── scripts.md
```

There is **no** central `docs/` dump. Every major folder carries its own descriptively named `.md` next to the code.

---

## Documentation Map (Neural Link)

| Document | Location |
|----------|----------|
| [Applications](apps/apps.md) | `apps/` |
| [Web Dashboard](apps/web/web.md) | `apps/web/` |
| [Agent](apps/agent/agent.md) | `apps/agent/` |
| [Packages](packages/packages.md) | `packages/` |
| [Types](packages/types/types.md) | `packages/types/` |
| [Validation](packages/validation/validation.md) | `packages/validation/` |
| [Database / MongoDB](packages/database/database.md) | `packages/database/` |
| [Config](packages/config/config.md) | `packages/config/` |
| [Scripts](scripts/scripts.md) | `scripts/` |
| [Architecture](packages/config/architecture.md) | `packages/config/architecture.md` |
| [API Contract](apps/web/api-contract.md) | `apps/web/api-contract.md` |
| [Privacy](apps/web/privacy.md) | `apps/web/privacy.md` |

---

## Setup

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- MongoDB ≥ 6 (local or Atlas)
- Windows / macOS / Linux for the agent

### Install

```bash
pnpm install
cp .env.example .env
# also: apps/web/.env.local and apps/agent/.env as needed
```

### MongoDB

```bash
# local example
mongod --dbpath <your-data-path>
# set MONGODB_URI in .env
```

### Development

```bash
pnpm dev:web      # Next.js dashboard + API → http://localhost:3000
pnpm dev:agent    # local agent (console / Electron)
pnpm build
pnpm test
```

---

## Environment Variables

See [`.env.example`](.env.example).

- `NEXT_PUBLIC_*` — safe for browser
- `MONGODB_URI`, `AUTH_SECRET`, AI keys — **server only**
- Agent uses `NEXUS_API_URL` + locally stored device credentials after pairing

---

## Local Agent Setup

1. Configure `apps/agent/.env` with `NEXUS_API_URL`
2. Run `pnpm --filter @nexus-twin/agent dev`
3. Pair via dashboard pairing code (short-lived)
4. Agent auto-starts on boot when packaged (Electron + OS login item / service)

Details: [agent.md](apps/agent/agent.md)

---

## Web Setup

1. Set `MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
2. `pnpm --filter @nexus-twin/web dev`
3. Sign up / sign in → add device → open digital twin

Details: [web.md](apps/web/web.md)

---

## Deployment

| Component | Target |
|-----------|--------|
| Web + API | Vercel |
| MongoDB | Atlas (or self-hosted) |
| Agent | Packaged Electron installers (Win/macOS/Linux) |

---

## Security

- HTTPS in production
- Authenticated APIs; per-device credentials
- Ownership checks on every device-scoped route
- Zod validation of all agent payloads
- No secrets in source; device revocation supported
- RLS-equivalent = application-layer ownership + MongoDB indexes

---

## Privacy

Default telemetry is system observability only. No keystrokes, documents, screenshots, mic/webcam, or message contents.

See [privacy.md](apps/web/privacy.md).

---

## Milestones

1. ✅ Monorepo + colocated documentation + shared contracts (MongoDB)
2. ✅ Local agent collectors + heartbeat (local print / cloud upload)
3. ✅ Cloud APIs + MongoDB ingestion + auth + pairing
4. ✅ Dashboard: devices, online/offline, live twin overview
5. ✅ Live monitor, history charts, events, timeline, process/app views
6. ✅ Baselines, anomalies, “what changed?”
7. ✅ AI diagnostics via **Google Gemini** (evidence → structured output)
8. ⏳ Packaging polish: Electron auto-start installers, deeper test suites

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Device stuck OFFLINE | Agent running? Heartbeat interval? `NEXUS_API_URL`? |
| Mongo connection errors | `MONGODB_URI`, network, Atlas IP allowlist |
| Empty metrics | Collector platform limits → UI shows `UNAVAILABLE` |
| Auth failures | `AUTH_SECRET`, cookie domain, `AUTH_URL` |

---

## Roadmap

Battery health · startup apps · crash analysis · alerts · family sharing · consented remote commands · predictive maintenance · weekly AI reports.

---

## Product Identity

**NEXUS//TWIN** — black + dark green consoles, monospace telemetry, professional system-engineering aesthetic.

Tagline: *Your computer. Reconstructed in the cloud.*
