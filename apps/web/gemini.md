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
GEMINI_API_KEY_2=optional_backup
GEMINI_API_KEY_3=optional_backup
# Or: GEMINI_API_KEYS=keyA,keyB,keyC
GEMINI_MODEL=gemini-3.6-flash
```

Set in `apps/web/.env.local`. Never expose to the browser or agent.

## Quota / capacity watchdog

- **Keys:** on HTTP 429 / quota, rotates `GEMINI_API_KEY` → `_2` → `_3` → … → first.
- **Models:** on HTTP 503 / high demand / 404, rotates through env models, then a built-in
  flash/lite/pro list, then **every text `generateContent` model** discovered from Google's
  models API (image/TTS/etc excluded). Cached 10 minutes.

## Cost control

Gemini is called **only** when the user asks (or via `/api/ai/diagnose`). Continuous telemetry is never sent to Gemini.

## Related

- [API Contract](../api-contract.md)
- [Web](../web.md)
- [Analysis helpers](../src/lib/analysis.ts)
