# Sprint notes

## Sprint 0 — Foundation (in progress, Claude Code, branch `claude/sprint-0`)

### Done
- Base decided: Crew-Health-Monitor with the owner's written permission (`docs/PERMISSIONS.md`, `docs/COMPLIANCE.md`).
- Added `SPEC.md`, `AGENTS.md`, `THIRD_PARTY_NOTICES.md`, `docs/COMPLIANCE.md`, `docs/PERMISSIONS.md`, `docs/progress/`, `src/motivaid/{engine,data,ui}/README.md`.
- Baseline on Node 22.23 (README says Node 24; 22.23 works, with an "SQLite experimental" warning):
  - `npm install`: OK (npm audit reports advisories, not fixed yet).
  - `npm test`: 25/25 passing (`src/triage.test.ts`).
  - `npm run build`: OK (warning: two chunks over 500 kB).
  - `npm run dev`: API on 127.0.0.1:8787, web on 127.0.0.1:5173.

### Done in part 2
- Removed the Gemini rewording (cloud AI, broke the offline rule): deleted `api/reword.js`, `api/reword.d.ts`, `.env.example`; removed the `/api/reword` routes from `server/index.ts` and the toggle from `src/Ask.tsx`; removed the README section.
- Rebranded: page title, sign-in heading + tagline, header name, logo label, package name `motivaid`, README header with credit to the original.
- Footer on every signed-in screen: "Simulated data. Not a medical device. Not clinically validated." plus the credit line.
- Offline: `vite.config.ts` writes `dist/sw.js` at build time; `src/main.tsx` registers it. Verified in Chromium: after one visit, with the server stopped, the app reloads and sign-in works (`docs/progress/sprint-0.png`).
- `BASE_PATH` support for GitHub Pages (anatomy fetch uses `import.meta.env.BASE_URL`).
- Added `docs/ARCHITECTURE.md`, `docs/AI_USE.md`, `docs/DEMO_SCRIPT.md`, `.github/workflows/deploy.yml`.
- Removals from the spec's list (Android, companion, Llama): none exist in this repo.

- Deployed: https://abdulhalim7177.github.io/Crew-Health-Monitor/ (GitHub Actions run 43602797207: tests, build, deploy all green). The live page loads and its service worker pre-caches the app.

### Open issues
- `npm audit` advisories not reviewed.
- Two JS chunks over 500 kB (three.js, app); fine for now.
- The original root `DEMO_SCRIPT.md`, `PROGRESS.md`, `CHALLENGE.md`, `RESEARCH_LOG.md` still describe Crew-Health-Monitor (Kilo Code: update or move under `docs/legacy/`).
- Kilo Code owns CI: the deploy workflow was added by Claude Code so Sprint 0 could ship. Feel free to split test and deploy jobs.

### Notes for other agents
- The stack is TypeScript, so use `.ts` where SPEC.md says `.js`.
