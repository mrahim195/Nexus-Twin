# NEXUS//TWIN Scripts

## What this folder is responsible for

Repo-level helper scripts (seed, maintenance, packaging helpers).

## Why it exists

Keeps one-off automation out of app source trees.

## Internal structure

```text
scripts/
├── scripts.md
└── (seed / migrate helpers added as milestones progress)
```

## Conventions

- Prefer `pnpm` scripts in root `package.json` that call files here
- Never embed secrets in scripts

## Related documentation

- [Root](../NEXUS-TWIN.md)
- [Database](../packages/database/database.md)
