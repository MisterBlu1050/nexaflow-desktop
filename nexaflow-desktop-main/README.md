# NexaFlow Desktop

NexaFlow is a Vite + React + TypeScript desktop-style HR demo for NexaFlow SA.
It simulates a Windows-like workspace with windows for NexaAI, Gmail, SIRH, ATS, calendar, documents, and supporting HR apps.

## What The App Does

- Routes slash commands into HR workflows.
- Grounds LLM outputs with a fixed company context for NexaFlow SA.
- Uses deterministic sections for sensitive or high-risk content.
- Exports branded PDF memos with charts and markdown content.
- Falls back to local sample data when Electron IPC is not available.

## Project Layout

- `src/pages/Index.tsx` bootstraps the desktop shell.
- `src/desktop/` contains the window manager, taskbar, start menu, and app windows.
- `src/desktop/apps/NexaAIWindow.tsx` sends prompts to Ollama or Gemini and appends locked sections.
- `src/hooks/use-command-router.ts` maps slash commands to prompts, engine selection, charts, and deterministic markdown.
- `src/lib/nexaflow-context.ts` is the source of truth for company facts, headcounts, salary anchors, and active cases.
- `src/utils/pdfExporter.tsx` renders branded PDF exports.
- `electron/main.ts` and `electron/preload.ts` expose SQLite-backed IPC helpers when the app is run through Electron.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
copy .env.example .env
```

3. Add your Gemini key if you want cloud fallback or diagram support:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Run

### Development

```bash
npm run dev
```

This starts the Vite app, usually on `http://localhost:8080`.

### Build

```bash
npm run build
```

### Preview A Build

```bash
npm run preview
```

### Tests

```bash
npm test
```

To run only the command-router checks:

```bash
npm test -- src/test/nexaai-router.test.ts
```

## Command Router

The assistant supports these routes:

- `/comp-analysis [dept]`
- `/people-report [attrition]`
- `/performance-review [name]`
- `/draft-offer [name]`
- `/onboarding [name]`
- `/policy-lookup [country]`
- `/cas-001` to `/cas-005`
- `/diagram [topic]`

Behavior is mostly controlled by:

- `src/hooks/use-command-router.ts`
- `src/lib/nexaflow-context.ts`
- `src/desktop/apps/NexaAIWindow.tsx`

Important rules:

- NexaFlow context is always prepended to LLM calls.
- `/cas-*` and `--deep` routes use Gemini.
- Deterministic sections are appended after the model response for high-risk reports.
- The app never invents cases beyond `CAS-001` to `CAS-005`.

## Data Sources

- `nexaflow.db` is the local SQLite database used by the Electron IPC layer.
- `NexaFlow_SIRH_500.xlsx` is the source spreadsheet for the import script.
- `scripts/import-sirh.py` imports the spreadsheet into SQLite.
- `scripts/check-db.cjs` is a quick sanity check for the database.
- `validate_router.mjs` performs end-to-end checks of the command router and grounding rules.

## Runtime Notes

- Browser mode is the default workflow during development.
- If Electron IPC is unavailable, the app falls back to in-memory sample data.
- Ollama is expected on `http://localhost:11434`.
- Gemini requires `VITE_GEMINI_API_KEY` in `.env`.

## Troubleshooting

- If commands fail with empty data, check whether Electron IPC is active.
- If Gemini routes fail, verify the API key first.
- If diagrams do not render, confirm Gemini is available because diagram generation depends on it.
- If PDF export looks broken, check `src/utils/pdfExporter.tsx` and the sanitize step for unsupported characters.

## Validation

The project includes a stricter router validation harness:

```bash
npx vite-node validate_router.mjs
```

It checks the grounding constants, route outputs, forbidden legacy values, and engine routing behavior.
