# NEXUS//TWIN Shared Types

## What this package is responsible for

Canonical TypeScript domain types for devices, telemetry, events, anomalies, AI diagnoses, and agent health. Used by agent, web, validation, and database packages.

## Why it exists

Prevent duplicated interfaces between agent and cloud.

## Internal structure

```text
packages/types/
├── types.md
├── package.json
└── src/
    ├── index.ts
    ├── device.ts
    ├── telemetry.ts
    ├── process.ts
    ├── events.ts
    ├── anomaly.ts
    ├── ai.ts
    └── agent.ts
```

## Dependencies

None (leaf package).

## Interfaces

Import: `import type { DeviceStatus, MetricSnapshot } from "@nexus-twin/types"`

## Related documentation

- [Packages](../packages.md)
- [Validation](../validation/validation.md)
- [API Contract](../../apps/web/api-contract.md)
