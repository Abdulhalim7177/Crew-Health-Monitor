# AGENTS.md

**Read `SPEC.md` first.** It is the MotivAid Master Brief, the single source of truth (with a repo note at the top). Follow its section 0 catch-up protocol, the hard rules in section 2 and the working rules in section 3.

## Quick facts
- Base: Crew-Health-Monitor by AdityaK0804, used with written permission (`docs/PERMISSIONS.md`). Keep the credit everywhere. VITALS: never open or copy it.
- Two apps, one codebase, no server: `index.html` (landing/login), `crew.html` (crew PWA), `console.html` (staff console). Data lives in the browser.
- Stack: React 19, TypeScript, Vite 7, Tailwind 4, three.js. `.js` names in the brief become `.ts`.

## Ownership
| Agent | Branch | Owns |
|---|---|---|
| Claude Code | `claude/…` | `src/motivaid/engine/`, `data/`, `store/`, data model, rules |
| opencode | `opencode/mobile` | `src/motivaid/mobile/` (crew app), `src/motivaid/shared/` |
| Kilo Code | `kilo/console-tests-docs` | `src/motivaid/console/`, tests, CI, docs, deploy config, compliance |

Need a change in a folder you don't own? Write it in `docs/SPRINT_NOTES.md`.

## Commands
`npm install` · `npm run dev` (http://localhost:5173, PIN `2026`) · `npm test` · `npm run build` · `npm run preview`

## Deadline
Sunday 15 Nov 2026, 23:59 local time. Aim for ~20:00. Cut list: `SPEC.md` section 10.
