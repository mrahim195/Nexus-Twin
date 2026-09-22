# NEXUS//TWIN Gemini AI

## What this is

Server-side diagnostics using **Google Gemini**. Located in `apps/web/src/lib/gemini.ts`.

## Flow

```text
User question
  → gather telemetry window from MongoDB
  → deterministic evidence package
  → Gemini (or fallback rules)
  → structured diagnosis
  → UI separates facts vs hypotheses
```

## Env

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.0-flash
```

Set in `apps/web/.env.local`. Never expose to the browser or agent.

## Cost control

Gemini is called **only** when the user asks (or via `/api/ai/diagnose`). Continuous telemetry is never sent to Gemini.

## Related

- [API Contract](../api-contract.md)
- [Web](../web.md)
- [Analysis helpers](../src/lib/analysis.ts)
