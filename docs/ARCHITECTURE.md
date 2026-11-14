# Architecture

Inspected 2026-11-14 on branch `claude/sprint-0`. Stack: React 19, TypeScript, Vite 7, Tailwind 4, Motion, three.js. API: Node's built-in `http` and `node:sqlite`.

## Layout
| Path | What it is |
|---|---|
| `index.html`, `src/main.tsx` | Entry point. Registers the service worker in production builds. |
| `src/App.tsx` | Shell: header, tabs, demo banner, footer disclaimer, toasts. |
| `src/triage.ts` (+ `triage.test.ts`) | Rules engine: Earth vs space verdicts per signal. Pure functions. |
| `src/model.ts`, `src/validate.ts` | Builds each day's readings from check-ins; input validation. |
| `src/data/` | `sources.ts` (citations), `signalGuide.ts`, `simulatedCrew.ts`, `missions.ts`, `emergency.ts`, `users.ts`. |
| `src/*.tsx` screens | `SignIn`, `Today`, `Overview` (crew health + 3D body), `BodyScan`, `TrendChart`, `CheckIn`, `EarthLink`, `Ask`, `Emergency`, `MissionMenu`, `ui.tsx` (shared bits). |
| `src/handbook.ts` | Offline "Ask the handbook": keyword search over rules and readings. |
| `src/body/` + `public/anatomy/` | 3D anatomy loader; `anatomy.json` + `anatomy.bin` (~13 MB, CC BY 4.0). |
| `src/api.ts` | Client API. Calls `/api/*`; if `/api/health` is missing, falls back to `src/localBackend.ts`. |
| `src/localBackend.ts` | In-browser stand-in for the server (localStorage). Used on static hosting. |
| `server/index.ts` | Local API + SQLite (`data/crew-health.sqlite`), port 8787. Same rules as the client. |
| `data/osdr/` | NASA OSD-569 blood count CSV (source data). |
| `src/motivaid/{engine,data,ui}` | New MotivAid code (see the ownership READMEs). |
| `vite.config.ts` | `BASE_PATH` env sets the base URL; a build plugin writes `dist/sw.js`. |

## Data loading
Simulated crew data comes from `src/data/simulatedCrew.ts`, built per day in `src/model.ts`. Check-ins are stored by the server (SQLite) or, without one, in browser localStorage. Anatomy is fetched from `${BASE_URL}anatomy/`.

## Offline
`vite build` writes `dist/sw.js` with every built file. It pre-caches them on the first visit. After that, assets come from the cache, pages try the network first and fall back to the cached copy, and `/api/*` is never cached. Lookups use `ignoreVary` because hosts may send `Vary: Origin`.

## Commands
| Task | Command |
|---|---|
| Install | `npm install` (Node 22.13+; README of the original says 24) |
| Dev (API + web) | `npm run dev` → http://localhost:5173, PIN `2026` |
| Tests | `npm test` (Vitest) |
| Build | `npm run build` (`tsc --noEmit` + Vite) → `dist/` |
| Pages build | `BASE_PATH=/Crew-Health-Monitor/ npm run build` |
| Deploy | Push to `main` → `.github/workflows/deploy.yml` → GitHub Pages (static, local-backend mode) |
