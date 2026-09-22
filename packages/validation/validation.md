# NEXUS//TWIN Validation

## What this package is responsible for

Zod schemas for every agent and browser API payload. The server must never trust the agent blindly.

## Why it exists

Shared runtime validation between API route handlers and (optionally) the agent before upload.

## Internal structure

```text
packages/validation/
├── validation.md
└── src/
    ├── index.ts
    ├── device.ts
    ├── telemetry.ts
    ├── process.ts
    ├── events.ts
    └── ai.ts
```

## Dependencies

- `zod`
- `@nexus-twin/types`

## Inputs / Outputs

- Input: unknown JSON
- Output: typed parsed objects or Zod errors

## Related documentation

- [Types](../types/types.md)
- [API Contract](../../apps/web/api-contract.md)
- [Database](../database/database.md)
