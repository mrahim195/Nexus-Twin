# NEXUS//TWIN Metric Collectors

## Responsibility

Read OS/hardware metrics and normalize to `@nexus-twin/types`. Return `null` fields when unsupported.

## Structure

| File | Collects |
|------|----------|
| `cpu.ts` | Utilization, cores, model, temp when available |
| `memory.ts` | RAM + swap |
| `disk.ts` | Partitions / capacity |
| `network.ts` | Interfaces + throughput estimates |
| `gpu.ts` | GPU stats when available |
| `process.ts` | Running processes |
| `os-info.ts` | Hostname, OS, arch |
| `index.ts` | Facade `collectMetricSnapshot()` |

## Conventions

- Never throw away the whole snapshot if one collector fails — mark that collector `UNAVAILABLE`
- Do not read file contents, keystrokes, or screenshots

## Related

- [Agent](../../agent.md)
- [Types](../../../../packages/types/types.md)
