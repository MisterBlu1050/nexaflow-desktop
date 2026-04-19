# NexaFlow CHRO Flight Simulator

Project: NexaFlow CHRO Flight Simulator — academic HR management simulator for teaching and demos.

Stack
- React + TypeScript
- Vite
- TailwindCSS
- Bun (optional local runner)
- Ollama / Gemma 4 (local LLM integration for NexaAI)

Purpose
This repository provides a Windows-like desktop simulator exposing HR apps (Gmail, SIRH, ATS-style, Payroll UI, Calendar, NexaAI assistant) and realistic fake data for offline demos and classroom exercises.

Key Features
- Windows 11 desktop emulation UI
- 9 internal apps (Gmail, NexaAI, Calendar, ATS, Payroll UI, Teams, Folders, Docs, Notifications)
- NexaAI assistant with 6 HR slash-commands (comp-analysis, draft-offer, onboarding, people-report, performance-review, policy-lookup)
- Static demo data under `src/data/` (employees, emails, cases, payroll, kpis, notifications)

Quick start (developer)
```bash
# Install dependencies
cd nexaflow-desktop
npm install

# Start dev server (npm) or try Bun if available
npm run dev
# or with bun
bun run dev
```

Repository layout
- `nexaflow-desktop/` — React app
- `src/data/` — demo data (employees.ts, emails.ts, cases.ts, payroll.ts, kpis.ts, ...)
- `src/lib/nexaai/commands.ts` — NexaAI slash-commands implementation
- `src/lib/markdown.ts` — lightweight markdown renderer for NexaAI
- `src/hooks/use-window-resize.ts` — pointer-based window resizing hook

Public release notes
This version is prepared for academic sharing. Sensitive or vendor-identifying placeholders have been sanitized. The canonical headcount KPI remains 500 (see `src/data/kpis.ts`) while the included `employees.ts` is a lightweight 50-profile extract for quick download and review.

Architecture (ASCII)
```
User Browser
	└─> Vite React App (nexaflow-desktop)
			 ├─ src/components (UI)
			 ├─ src/desktop (Windowing + apps)
			 └─ src/data (static demo data)
						└─ NexaAI <-> src/lib/nexaai (slash-commands)
```

License
MIT

Contact / Next steps
- To finalize the public package I can: integrate the full prompt set into `src/lib/nexaai/commands.ts`, produce a downloadable 50-profile SIRH dump, and run a sanitization pass before publishing to GitHub.

