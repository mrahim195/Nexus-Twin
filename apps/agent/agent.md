# NEXUS//TWIN Agent

## What this application is responsible for

Local observability plane: collect OS telemetry, heartbeat, queue when offline, push outbound to the cloud API. Optionally wraps in Electron for tray + auto-start.

## Why it exists

The dashboard cannot inspect your PC. This agent is the only component that observes the machine.

## Internal structure

```text
apps/agent/
├── agent.md
├── electron/          desktop shell + auto-start
├── src/
│   ├── collectors/    CPU, RAM, disk, net, GPU, processes, OS
│   ├── transport/     HTTPS client + retry
│   ├── scheduler/     interval runners
│   ├── storage/       bounded offline queue + credentials
│   └── security/      token handling
```

## Startup sequence

```text
OS boot → agent start → load config → authenticate/pair
  → collectors → heartbeat → telemetry upload
```

## Dependencies

- `systeminformation` for cross-platform metrics
- `@nexus-twin/types`, `validation`, `config`

## Inputs / Outputs

- Inputs: OS APIs, pairing code, env (`NEXUS_API_URL`)
- Outputs: heartbeats, metric/process snapshots, events (HTTPS JSON)

## Platform limitations

Metrics marked unavailable when the OS/hardware does not expose them. Never invent values.

## Related documentation

- [Collectors](src/collectors/collectors.md)
- [Transport](src/transport/transport.md)
- [Scheduler](src/scheduler/scheduler.md)
- [Storage](src/storage/storage.md)
- [Security](src/security/security.md)
- [Electron](electron/electron.md)
- [Apps](../apps.md)
- [API Contract](../web/api-contract.md)
