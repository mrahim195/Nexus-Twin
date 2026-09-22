# NEXUS//TWIN Config

## What this package is responsible for

Default collection intervals, offline timeouts, anomaly thresholds, retention policy constants, and product metadata.

## Why it exists

Avoid magic numbers scattered across agent and web.

## Internal structure

```text
packages/config/
├── config.md
├── architecture.md
└── src/
    ├── index.ts
    ├── intervals.ts
    ├── thresholds.ts
    └── retention.ts
```

## Related documentation

- [Architecture](architecture.md)
- [Agent](../../apps/agent/agent.md)
- [Root](../../NEXUS-TWIN.md)
