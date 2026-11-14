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

## Catch-up to the Master Brief (Claude Code, 2026-11-14)

**What exists.** Sprint 0 is done on Crew-Health-Monitor (permission on file), live at https://abdulhalim7177.github.io/Crew-Health-Monitor/. The crew-facing UI is the original app: signals, 3D body, trends, check-in, Earth link, handbook, emergency.

**What changed for the brief.**
- `SPEC.md` is now the Master Brief (with a repo note); `AGENTS.md` is a short pointer with the new ownership (adds `store/`, `mobile/`, `shared/`, `console/`).
- Removed the Node + SQLite server (`server/index.ts`, `concurrently`, `npm run server`): "a real server" is a non-goal. `src/api.ts` now always uses `src/localBackend.ts`. `npm run dev` is just Vite.
- Three entry pages: `index.html` (landing), `crew.html` (crew app + PWA manifest + icon), `console.html` (branded shell). The service worker caches all three. Verified offline in Chromium with the server stopped: all three pages load, and crew sign-in works.
- "Demo login, not secure" on the crew sign-in, the banner, the landing page and the console footer.

**Sprint status.** Sprint 0 is complete against the brief. Sprint 1 is next.

**Next (Claude Code).** `src/motivaid/store/` (typed read/update, subscribe, `BroadcastChannel`, versioned schema, seed/reset); `data/` seed for 4 crew with the hero scenario and demo accounts for all four roles (`crew`, `crewMedicalOfficer`, `flightSurgeon`, `missionAdmin`); then `engine/evaluate` with the five rules (Sprint 2).

**Notes for other agents.**
- opencode: the crew app currently lives in `src/*.tsx` (original UI). Build `src/motivaid/mobile/` against the brief's data model; reuse the existing components where they fit. `crew.html` can point to your new entry when it is ready.
- Kilo Code: `src/motivaid/console/main.tsx` is a shell for you to replace. `.github/workflows/deploy.yml` already runs test + build + deploy on push to `main`; split it if you add CI on branches. `docs/COMPLIANCE.md` already has the UNCHECKED checklist.
- Existing roles in `src/data/users.ts` are `crew | cmo | surgeon`. The store will add the brief's four roles; the original UI keeps working until it migrates.

## Sprint 1 — Shared core and crew check-in (Claude Code + a Sonnet helper agent, 2026-11-14)

### Done
- **3D body merge:** AstroBone's bones and muscles (Z-Anatomy, CC BY-SA 4.0) are new "Bones" and "Muscles" systems in `src/BodyScan.tsx`, loaded on first use from `public/anatomy/musculoskeletal/` (`src/body/skeleton.ts`). Weight-bearing bones carry the resistance-exercise signal. AstroBone's `human_body_clothed.glb` is not used (licence unknown). Credits are in `THIRD_PARTY_NOTICES.md`.
- **data/:** brief types (`types.ts`), pre-approved `sources.ts`, 6 demo accounts covering all 4 roles + 4 crew (`accounts.ts`), indicators with hazard tags (`indicators.ts`), demo parameters (`parameters.ts`), deterministic 30-day hero scenario (`scenario.ts`, hero C1, seeded through day 20, today = day 21 = 14 Nov).
- **engine/baseline.ts:** personal baseline (first 7 days, needs ≥3), Usual/Watch/Act status with an SD floor, data age, streak. 14 tests.
- **store/:** localStorage + BroadcastChannel (storage-event fallback), per-tab session, schema v1, seed/reset, validated check-ins, `useStore` hook. 6 tests.
- **UI:** landing login with all 6 accounts and routing by role (crew → `crew.html`, the medical officer, flight surgeon and admin → `console.html`). A new first crew tab, "Check-in" (`src/motivaid/mobile/`), with a Today panel, a check-in sheet (all fields + red flags), signal cards (status text + colour, Demo parameter badge, hazard chip, reason, next step, data age, sources, sparkline) and a trend chart with a ±1 SD band (`src/motivaid/shared/`). The console has a live "Latest check-ins" table.
- Verified in Chromium at 390×844: crew login → check-in → cards update; the console in a second tab shows the new row without reloading. Screenshot: `docs/progress/sprint-1.png`. 45 tests green, build green.

### Open issues / notes for other agents
- **opencode (mobile):** the original app header (`src/App.tsx`) is not phone-friendly. It wraps into half the screen and causes a horizontal scroll at 390 px. Compact it on small screens: hide the day selector and the "Log check-in" button on the Check-in tab, or move the extra tabs into a menu.
- **Two day counters:** the original app's "Day 60/90" (its own simulation) and the store's "Mission day 21". Sprint 2's day scrubber should drive both from `store.missionDay`, or hide the old one in the crew app.
- Keyboard focus on the new cards and sheet has not been checked by eye. Accessibility pass in Sprint 5.

### Body update (after Sprint 1)
- The AstroBone layers now load with the body: bones, muscles, a **beating heart** (driven by the wearable resting heart rate) and **blood vessels** (red arteries, blue veins; arteries pulse with each beat). The original heart, aorta, vessels and vertebral column are hidden once they load. Assets live in `public/anatomy/astrobone/` (CC BY-SA 4.0). Reduced-motion users get a still heart.

## Sprint 2 — Interaction engine and loop visual (Claude Code + a Sonnet helper agent, 2026-11-14)

### Done
- **Engine** (`src/motivaid/engine/evaluate.ts`, `src/motivaid/data/rules.ts`): `evaluate(history, baselines, ruleset)` with LOOP-SLEEP-STRESS, LOOP-STRAIN-HEART, ISOLATION-DRIFT, FATIGUE-PERFORMANCE and RED-FLAG. All thresholds are in `rules.ts` as demo parameters with staff-editable ranges; `effectiveRuleset(overrides)` clamps edits; the red flag always comes first and escalates. 19 tests (fire, no-fire, red-flag override, overrides, scenario timeline).
- **Scenario check:** hero C1 fires LOOP-SLEEP-STRESS on day 17 and LOOP-STRAIN-HEART (act) on day 20, and is clear by day 24. C2–C4 never fire. The loop needs 4 days in a row (demo parameter) so it starts on day 17, as the brief says.
- **UI** (`src/motivaid/shared/WhyPanel.tsx`, `FindingCard.tsx`, `LoopVisual.tsx`, `severity.ts`; `src/motivaid/mobile/MindToday.tsx`): findings list, "Why this fired" (evidence rows, "Fires when" parameters, next step, source links, Demo parameter badge), HEART–SLEEP–MIND loop SVG, and a day scrubber (1–30, play/pause, back to today; future days labelled "Scripted scenario", check-in only on today).
- **Body:** the AstroBone layers are fitted by least squares on heart, kidneys, skull and pelvis landmarks (`fitLandmarks`, tested).
- **Phone:** the crew tab bar now scrolls inside itself; no horizontal page scroll at 390 px.
- 67 tests green, build green. Screenshot: `docs/progress/sprint-2.png`.

### Open issues
- The female reference body's arms are held wider than the AstroBone skeleton's (would need joint re-posing; not planned).
- Play button, keyboard use and the red-flag path are not yet checked in a browser (Sprint 5 accessibility pass).
- Next (Sprint 3, console): create Alerts from act/escalate findings (`evaluateDay` + store), triage queue, crew overview grid, roster, Earth-link messages.
