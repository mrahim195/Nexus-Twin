# NEXUS//TWIN Packages

## What this folder is responsible for

Shared libraries consumed by `apps/web` and `apps/agent`.

## Why it exists

Single source of truth for types, Zod schemas, MongoDB models, and shared config — no duplicated contracts.

## Internal structure

```text
packages/
├── packages.md
├── types/         shared TypeScript domain types
├── validation/    Zod schemas for API + agent payloads
├── database/      MongoDB connection + Mongoose models
└── config/        intervals, thresholds, architecture notes
```

## Important packages

| Package | Doc |
|---------|-----|
| `@nexus-twin/types` | [types.md](types/types.md) |
| `@nexus-twin/validation` | [validation.md](validation.md) |
| `@nexus-twin/database` | [database.md](database/database.md) |
| `@nexus-twin/config` | [config.md](config/config.md) |

## Dependencies

Packages may depend on each other in one direction:

```text
config → (none)
types → (none)
validation → types
database → types
apps → all of the above
```

## Interfaces

Export only through each package’s `src/index.ts`.

## Conventions

- Prefer `workspace:*` protocol in package.json
- Keep packages framework-agnostic where possible (database is Node-only)

## Related documentation

- [Root](../NEXUS-TWIN.md)
- [Apps](../apps/apps.md)
- [Architecture](config/architecture.md)
