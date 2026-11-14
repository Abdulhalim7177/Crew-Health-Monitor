# AGENTS.md — shared rules for every coding agent (Claude Code, opencode, Kilo Code)

Project: **MotivAid** — NASA Space Apps Challenge 2026, challenge "Create Health Monitoring Software for Astronauts on Space Missions".
The full plan is in `SPEC.md` (read its "Base change" note first). This file is the short version of the rules that must never be broken.

## Hard rules
1. **Licences.** The code base is Crew-Health-Monitor by AdityaK0804, used with written permission (`docs/PERMISSIONS.md`) on condition that the original is credited. Keep that credit in `THIRD_PARTY_NOTICES.md`, the README and the pitch. Keep the CC BY 4.0 anatomy attributions.
2. **No unlicensed code.** Do NOT clone, open, read, copy or paste anything from `noor-hossain13/vitals-astronaut-health-monitor` unless `docs/PERMISSIONS.md` records written permission from its owner.
3. **Honesty.** All astronaut data is simulated and must be labelled "Simulated". The app is not a medical device and is not validated; say so in the UI footer and README.
4. **No invented facts.** Every threshold is either linked to a source in `src/motivaid/data/sources.ts` (or the existing `src/data/sources.ts`) or flagged `demoParameter: true` and shown as "Demo parameter". Only use the citations pre-approved in `SPEC.md` section 6, or ones already verified in `RESEARCH_LOG.md`; anything else must be looked up and verified first.
5. **Offline.** No network calls at runtime. The app must work offline after the first load. (The optional Gemini reword in `api/reword.js` breaks this and is scheduled for removal.)
6. **No scope creep.** Hardware, BLE, cloud AI, camera or voice emotion detection, and free-form LLM advice are out of scope. See `SPEC.md` section 1.

## Working rules
- Inspect the real repo layout before editing; do not assume folder names. Keep `docs/ARCHITECTURE.md` accurate.
- Work on your own branch (`claude/…`, `opencode/…`, `kilo/…`). Merge only when `npm test` and `npm run build` pass.
- Ownership: Claude Code owns `src/motivaid/engine/` and `src/motivaid/data/`; opencode owns `src/motivaid/ui/` and styles; Kilo Code owns tests, CI, docs, deploy config and compliance notes. Need a change in someone else's folder? Write it in `docs/SPRINT_NOTES.md` instead of editing it.
- Engine code is pure functions with unit tests (fire and no-fire cases). No DOM code in `engine/`.
- Status is never shown by colour alone: always add a text label. Keep everything keyboard accessible.
- Small commits with clear messages. Do not commit secrets (`.env`) or large binaries you did not need.
- End each sprint with: tests green, build green, deployed URL checked, a screenshot in `docs/progress/`, and a short entry in `docs/SPRINT_NOTES.md`.

## Commands
`npm install` · `npm run dev` (API :8787 + web :5173, PIN `2026`) · `npm test` · `npm run build`

## Deadline
Submission closes **Sunday 15 Nov 2026, 23:59 local time**. Aim to submit by ~20:00 Sunday. If a sprint slips, use the cut list in `SPEC.md` section 10.
