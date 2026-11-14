> **Repo note (2026-11-14).** This is `MotivAid_Master_Brief.md`, the single source of truth. MotivAid is built on **Crew-Health-Monitor** (written permission in `docs/PERMISSIONS.md`, allowed by hard rule 2), not AstroBone; read "AstroBone" in rules 1 and 3 and section 5 as Crew-Health-Monitor. Its anatomy assets are CC BY 4.0, not CC BY-SA. The stack is TypeScript, so `.js` file names in this brief become `.ts` (for example `src/motivaid/data/sources.ts`).

# MotivAid Master Brief (single source of truth)

NASA Space Apps Challenge 2026 · Challenge: **Create Health Monitoring Software for Astronauts on Space Missions** (Intermediate).
Deadline: **Sunday 15 Nov 2026, 23:59 local time** (aim to submit by ~20:00). Builder: one person with three coding agents: Claude Code, opencode, Kilo Code.

This one file replaces any earlier SPEC, AGENTS or KICKSTART files. If you were started from an earlier version, follow section 0 first.

---

## 0. Catch-up protocol (agents are already running)

Do this before writing more code:

1. Read this whole file.
2. Inspect the current state: `git status`, `git log --oneline -20`, the branches, the folder layout, `docs/` (if it exists) and `docs/SPRINT_NOTES.md`.
3. Compare what exists with the sprint plan (section 8). Decide which sprint the project is really in.
4. **Do not redo or delete working code.** Keep what already works and fits this brief. Change only what conflicts with a hard rule (section 2) or with the two-app design (section 1).
5. **Licence check:** if the repo contains code, text or assets copied from `AdityaK0804/Crew-Health-Monitor` or `noor-hossain13/vitals-astronaut-health-monitor`, and `docs/PERMISSIONS.md` has no written permission from that repo's owner, **stop and tell the user** instead of continuing on it.
6. Write a short status entry in `docs/SPRINT_NOTES.md` (create the file if missing): what exists, what you changed, what you will do next, anything blocking another agent.
7. Continue with the sprint tasks for the folders you own (section 5).

### Paste-ready prompts

**Claude Code**
```
Read MotivAid_Master_Brief.md and follow section 0 (catch-up protocol) first. Then continue the sprint plan for the folders you own: src/motivaid/engine, data and store. Do not redo working code. Respect the hard rules in section 2. Ask me if anything is unclear.
```
**opencode**
```
Read MotivAid_Master_Brief.md and follow section 0 first. You own src/motivaid/mobile (crew app) and src/motivaid/shared (shared components and styles). Work on branch opencode/mobile. Continue the sprint plan; code against the data model in section 6 with a local stub until the store and engine land, and note that in docs/SPRINT_NOTES.md. Respect the hard rules in section 2. Ask me if anything is unclear.
```
**Kilo Code**
```
Read MotivAid_Master_Brief.md and follow section 0 first. You own src/motivaid/console (staff web console), tests, CI, docs and deploy config. Work on branch kilo/console-tests-docs. Continue the sprint plan: verify the foundation, fill docs/COMPLIANCE.md with the UNCHECKED checklist, add CI that runs tests and build, test the store and engine as they land, and build the console from Sprint 3. Respect the hard rules in section 2. Ask me if anything is unclear.
```

---

## 1. What we are building

**MotivAid** is a two-app platform for astronaut wellbeing with a MIND-first focus, built from **one codebase**:

| App | Users | Form | Purpose |
|---|---|---|---|
| **Crew app** | Astronauts (crew) | **Installable mobile PWA**, offline-first | Login, daily check-in, trends against personal baseline, explained findings, personalised plan, messages from staff |
| **Staff console** | Crew medical officer, flight surgeon, mission admin | **Web app**, desktop-first | Monitor the whole crew, triage alerts, manage roster and roles, edit rules and care plans |

**Login is simulated** (demo accounts, no real security) and **data is local** (no server). The apps share data through the browser (same origin and profile) using a shared store with `BroadcastChannel`, so a crew check-in appears on the console live in another tab. State this limitation honestly in the README and on the Data page. A real backend is roadmap.

The brief asks for a visual tool for astronaut self-assessment with guidance on treatments and health improvements; any input type is allowed. Suggested features: clickable body figure, dynamic charts, colour coding, prompts for routine measurements, gamification, simple explanations for non-experts, different mission environments.

### Headline differentiators
1. **Cross-domain interaction engine**: detects and explains patterns across HEART, SLEEP and MIND (for example sleep down, stress up, resting heart rate up) rather than flagging indicators alone; shown as a lit-up loop.
2. **Behavioural and psychosocial depth**: mood, stress, isolation and confinement, and social contact are first-class signals.
3. **Closed loop between crew and staff**: a crew finding becomes a triage alert on the console; staff messages and plan changes reach the crew app after a simulated Earth-link delay.
4. **Evidence and honesty**: every rule cites a source or is labelled "Demo parameter"; simulated data is always labelled.

### Non-goals (roadmap slide only, do NOT build)
Wearable hardware (ESP32, MAX30102, GSR, cortisol biosensor), BLE, a cloud AI backend, a real server or authentication, real cross-device sync, camera or voice emotion detection, free-form LLM advice, native app stores.

---

## 2. Hard rules (never break)

1. **Base code = AstroBone** (https://github.com/mysunatislam/astrobone-space-apps-2026, **MIT**). Keep its `LICENSE` and copyright notice, keep `THIRD_PARTY_NOTICES.md` up to date, credit it in the README and the pitch.
2. **No unlicensed code.** Crew-Health-Monitor and VITALS state no licence, so default copyright applies. Do **not** clone, open, read, copy or paste their code, text, layouts or assets unless `docs/PERMISSIONS.md` contains written permission from that repo's owner (a pasted message or link). Build from the concept descriptions in section 4. If unsure, stop and ask the user.
3. **Assets:** fetch anatomy or 3D assets from their original sources and keep licences and attribution. AstroBone's anatomy assets are CC BY-SA (share-alike); keep that notice on them.
4. **Honesty:** all astronaut and staff data is simulated and labelled "Simulated". The login screen says "Demo login, not secure". The footer says "Simulated data. Not a medical device. Not clinically validated." Never claim diagnosis or validation.
5. **No invented facts:** every threshold is either linked to a source in `src/motivaid/data/sources.js` or flagged `demoParameter: true` and shown as "Demo parameter". Use only the citations in section 6; anything else must be looked up and verified first. Add an "Earth reference vs spaceflight-adjusted" comparison only where the adjustment has a verified source.
6. **Guidance text** is `contentStatus: "demo wording"` unless sourced; staff edits change it to `"staff-edited (demo)"`.
7. **Offline:** no network calls at runtime; both apps work offline after the first load.
8. **Accessibility:** status is never shown by colour alone (always a text label); everything is keyboard accessible.
9. **Event terms:** the user must check (a) whether building on another entry or open-source code is allowed and under what conditions, and (b) whether AI-tool use must be disclosed. Record the checklist in `docs/COMPLIANCE.md` as UNCHECKED until the user confirms; write `docs/AI_USE.md` (finalised at the end).
10. **Scope:** do not build non-goals from section 1. If a cut is needed, use the cut list in section 10.

---

## 3. Working rules

- Inspect the real repo layout before editing and keep `docs/ARCHITECTURE.md` accurate. Do not assume folder names.
- One branch per agent (`claude/…`, `opencode/mobile`, `kilo/console-tests-docs`). Merge into `main` one at a time, only when tests and build pass.
- Engine code is pure functions with unit tests (fire and no-fire cases), no DOM.
- Small commits, clear messages. No secrets, no large unneeded binaries.
- Each sprint ends with: tests green, build green, deployed URL checked, a screenshot or short recording in `docs/progress/`, and an entry in `docs/SPRINT_NOTES.md`.
- Need a change in a folder you do not own? Write it in `docs/SPRINT_NOTES.md` instead of editing it.

---

## 4. Concepts to implement (written clean-room; build in our own code and style)

| Concept | Description |
|---|---|
| Signal card | Indicator, value, status colour plus text label, **hazard chip**, one-sentence plain-language reason, next step, data age. |
| Hazard tagging | Every signal and finding links to one of NASA's five spaceflight hazards: radiation, isolation and confinement, distance from Earth, gravity fields, hostile closed environment. |
| Body view (crew app) | Reuse AstroBone's MIT 3D twin or a simple 2D body; regions highlight on findings. MIND and social signals get their own panel. |
| Crew overview (console) | Grid of crew members: status, top finding, last check-in age. |
| Triage queue (console) | Findings across the crew with status (new, acknowledged, in review, resolved), assignee, notes. |
| Earth link delay | Simulated message queue with a countdown; messages arrive after a mission-day delay (compressed for demo). |
| Roles | crew, crewMedicalOfficer, flightSurgeon, missionAdmin; each sees and can do different things. |

---

## 5. Tech approach and ownership

- Keep AstroBone's stack: Vite, ES modules, three.js, service worker. Add **three entry pages** in one Vite multi-page build: landing and login (routes by role), the crew app (mobile-first, PWA manifest, installable), and the staff console (desktop-first). Check how the fork's build is configured and adapt.
- Remove the fork's Android, companion, local-LLM and heavy ML parts only if they are off by default and removal keeps tests and build green; record removals in `docs/SPRINT_NOTES.md`.
- Code lives under `src/motivaid/`:
  - `engine/` pure functions, fully unit-tested
  - `data/` simulated mission data, rule definitions, sources, plan content
  - `store/` shared local store: wraps `localStorage` (or IndexedDB), typed read and update functions, a subscribe API, `BroadcastChannel` to notify other tabs, versioned schema, seed and reset
  - `shared/` shared components and styles (signal card, loop visual, status badge)
  - `mobile/` the crew app
  - `console/` the staff console
- Simulated login: a list of demo accounts with roles and demo PINs shown on the login screen; the session lives in the store. No real credentials.
- Deploy to GitHub Pages or Vercel (whichever is quicker). A public URL must exist at all times from Sprint 0.

| Agent | Owns |
|---|---|
| Claude Code | `engine/`, `data/`, `store/`, data model, rules |
| opencode | `mobile/` (crew app), `shared/` components and styles |
| Kilo Code | `console/` (staff web), tests, CI, docs, deploy config, compliance notes |

The user may reassign ownership.

### Docs to keep in the repo
`docs/ARCHITECTURE.md` (real layout, data loading, test and build commands, how the entry pages are built), `docs/COMPLIANCE.md`, `docs/AI_USE.md`, `docs/PERMISSIONS.md` (starts as "No third-party permissions granted yet."), `docs/SPRINT_NOTES.md`, `docs/DEMO_SCRIPT.md` (section 9), `docs/progress/` (screenshots), `THIRD_PARTY_NOTICES.md`, and a `README.md` for MotivAid (problem, solution, the two apps, run instructions, demo accounts, data and sources, attributions, limitations including local-data and demo login, roadmap).

---

## 6. Data model (JSDoc / JSON)

```js
/** @typedef {'HEART'|'SLEEP'|'MIND'} Domain */
/** @typedef {'radiation'|'isolation_confinement'|'distance_from_earth'|'gravity_fields'|'hostile_closed_environment'} Hazard */
/** @typedef {'ok'|'watch'|'act'|'escalate'} Severity */
/** @typedef {'crew'|'crewMedicalOfficer'|'flightSurgeon'|'missionAdmin'} Role */

/** @typedef {{id:string, name:string, role:Role, crewId?:string, demoPin:string}} User */
/** @typedef {{id:string, name:string, missionRole:string, missionId:string, active:boolean}} CrewMember */

/** One daily check-in. Map to AstroBone's existing fields first; add only what is missing. */
/**
 * @typedef {Object} CheckIn
 * @property {string} crewId
 * @property {number} missionDay
 * @property {string} date                 // ISO
 * @property {number} sleepHours
 * @property {number} sleepQuality         // 1-5
 * @property {number} fatigue              // 1-7 (Samn-Perelli, if present in the fork)
 * @property {number} mood                 // 1-5
 * @property {number} stress               // 1-5
 * @property {number} socialContact        // 1-5
 * @property {number} confinementStrain    // 1-5
 * @property {number} restingHr            // bpm
 * @property {number} [reactionMedianMs]
 * @property {number} [exerciseMin]
 * @property {string[]} redFlags           // any present = override
 * @property {'simulated'|'user'} source
 */

/** @typedef {{indicator:string, mean:number, sd:number, n:number}} Baseline */   // personal, after >= 3 usable check-ins (reuse the fork's method)

/**
 * @typedef {Object} Finding
 * @property {string} id                   // e.g. 'LOOP-SLEEP-STRESS'
 * @property {string} crewId
 * @property {number} missionDay
 * @property {Domain[]} domains
 * @property {Hazard} hazard
 * @property {Severity} severity
 * @property {string} title
 * @property {string} explanation          // plain language
 * @property {{indicator:string,value:number,baselineMean:number,deltaSd:number}[]} evidence
 * @property {string[]} sourceIds
 * @property {boolean} demoParameter
 * @property {string} nextStep
 */

/** Staff triage record created from a Finding of severity act or escalate. */
/** @typedef {{id:string, findingId:string, crewId:string, status:'new'|'acknowledged'|'in_review'|'resolved', assigneeId?:string, notes:{byId:string, at:string, text:string}[]}} Alert */
/** @typedef {{id:string, fromId:string, toId:string, sentAt:string, deliverAt:string, body:string}} Message */
/** @typedef {{ruleId:string, params:Object, editedById:string, editedAt:string}} RuleOverride */
/** @typedef {{id:string, title:string, type:'sleep'|'breathing'|'social'|'movement'|'reflect', durationMin:number, rationale:string, sourceIds:string[], contentStatus:'demo wording'|'sourced'|'staff-edited (demo)'}} PlanItem */
```

### Pre-approved sources (`src/motivaid/data/sources.js`)
- `engel1977`: Engel, G. L. (1977). The need for a new medical model. *Science*, 196(4286), 129–136. https://doi.org/10.1126/science.847460
- `barger2014`: Barger et al. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight: An observational study. *The Lancet Neurology*, 13(9), 904–912. https://doi.org/10.1016/S1474-4422(14)70122-X
- `basner2014`: Basner et al. (2014). Psychological and behavioral changes during confinement in a 520-day simulated interplanetary mission to Mars. *PLOS ONE*, 9(3), e93298. https://doi.org/10.1371/journal.pone.0093298
- `mendes2024`: Mendes Zambetta et al. (2024). Cardiovascular adaptations associated with spaceflight and simulated weightlessness. *Frontiers in Physiology*. https://doi.org/10.3389/fphys.2024.1438089
- `hrp-hazards`: NASA Human Research Program, Five Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- `hrp-risks`: NASA Human Research Program, Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/

The OSDR datasets in the fork (for example OSD-575, OSD-569, OSD-656, OSD-804, OSD-435) are used by AstroBone for prioritisation context. Re-check what each file supports before citing it for a new claim.

---

## 7. Rules engine

`evaluate(history, baselines, ruleset) -> Finding[]`, pure and deterministic. Staff can override rule parameters (`RuleOverride`); the engine takes the effective ruleset as input.

All numeric thresholds are parameters in one file, relative to the personal baseline (for example "at least 1 SD below baseline for 3 consecutive days"), and `demoParameter: true` unless sourced.

| Rule id | Fires when | Domains | Hazard | Sources |
|---|---|---|---|---|
| `LOOP-SLEEP-STRESS` | Sleep below baseline and stress above baseline for N consecutive days | SLEEP, MIND | isolation_confinement | barger2014, basner2014 |
| `LOOP-STRAIN-HEART` | The above plus resting HR above baseline | SLEEP, MIND, HEART | isolation_confinement | barger2014, mendes2024 |
| `ISOLATION-DRIFT` | Social contact and mood both trending down over N days | MIND | isolation_confinement | basner2014 |
| `FATIGUE-PERFORMANCE` | Fatigue up and reaction-test slowing versus baseline | SLEEP, MIND | hostile_closed_environment | barger2014 |
| `RED-FLAG` | Any red-flag symptom | any | any | hrp-risks |

Severity ladder: `ok` (routine) → `watch` (plan items) → `act` (strong plan items, creates a console Alert for the crew medical officer) → `escalate` (Alert for the flight surgeon, delayed message, approved-emergency placeholder labelled "demo wording"). `RED-FLAG` always overrides.

Staff-edit guardrails: parameters can change only within allowed ranges defined in the data file; every change is logged with who and when; modified rules show a "modified by staff (demo)" badge in both apps.

---

## 8. Sprints (Africa/Lagos time)

Each sprint ends with the checks in section 3. If a sprint slips, use the cut list (section 10). If the project is already ahead of a sprint, skip what is done.

| Sprint | When | Goal and tasks | Done when |
|---|---|---|---|
| **0 Foundation** | Sat 15:15–16:30 | Fork of AstroBone with `LICENSE` kept; docs scaffold (section 5); repo inspected and `docs/ARCHITECTURE.md` written; unneeded parts removed; rebrand to MotivAid; three entry pages (login, crew app with PWA manifest, staff console) as branded shells; `src/motivaid/*` folders created; deployed | Public URL loads all three pages and works offline after one visit; tests and build pass |
| **1 Shared core and crew check-in** | Sat 16:30–20:30 | Store with subscribe and `BroadcastChannel`; seed data for 4 crew with one hero scenario (section 9); demo accounts for all four roles; login routing by role; crew check-in form (existing fields plus mood, stress, socialContact, confinementStrain); signal cards, trend charts, "Today" panel | Log in as crew on a phone-sized window, submit a check-in, see updated cards and trends with hazard chips and data age; the check-in is visible from another tab |
| **2 Interaction engine and loop visual** | Sat 20:30–01:00 | `evaluate` and the five rules, thresholds in one parameters file, tests for fire, no-fire and red-flag override; "Why this fired" panel with evidence rows, source links, Demo parameter badge; HEART–SLEEP–MIND loop visual; day scrubber for scenario playback | The scripted scenario fires `LOOP-SLEEP-STRESS` then `LOOP-STRAIN-HEART` with correct explanations; each rule tested |
| **3 Staff console** | Sun 08:00–11:30 | Staff login to console; crew overview grid; crew detail reusing shared components; alert triage queue (status, assignee, notes, created from act/escalate findings); roster and roles page (missionAdmin only: view, add, deactivate, assign roles); Earth-link messaging staff to crew | A crew check-in in one tab creates an Alert on the console in another tab; staff acknowledge, add a note and message the crew member; the message arrives after the delay |
| **4 Coach, adherence, staff editing** | Sun 11:30–15:00 | Plan generator: finding → 1–4 plan items from approved content (sleep wind-down, paced breathing with visual timer and optional audio cue, social-connection prompt, movement break, short reflection) with rationale and source or "demo wording"; adherence (mark done, streaks, weekly progress rings, encouraging only); console editor for rule parameters (within allowed ranges) and plan item text, logged and badged, taking effect in the crew app | A firing finding produces a plan; completing items updates adherence; a staff rule edit changes the crew app's result and is logged and badged |
| **5 Evidence, polish, submit** | Sun 15:00–19:30 | Evidence page in both apps (each rule, sources, parameters, demo-parameter flags, five-hazard mapping); Data page (simulated vs OSDR context, local-data limitation); Limitations page; offline and accessibility pass; demo script rehearsed and 2-minute video recorded with crew app and console side by side; README; updated deck (hardware and real backend only on the roadmap slide); submit on the Project tab and verify | Submitted; live URL and repo link work; buffer until 23:59 |

---

## 9. Demo scenario and video outline

Mission day 1–30, deep-space transit, four crew, one hero crew member. Days 1–12 stable. From day 13 sleep drops and stress rises; day 17 `LOOP-SLEEP-STRESS` fires; day 20 resting HR rises and `LOOP-STRAIN-HEART` fires and an Alert reaches the console; staff acknowledge, add a note and message the crew member (delayed); the crew app shows the plan; adherence on days 21–24 brings stress and sleep back toward baseline; staff resolve the alert.

Video (2 minutes): 0:00 problem (15 s) → 0:15 crew check-in on phone (20 s) → 0:35 loop fires and "why" panel (30 s) → 1:05 alert appears on the console, triage and message (30 s) → 1:35 coach plan and staff rule edit (15 s) → 1:50 evidence page, roadmap, close (10 s).

---

## 10. Cut list (cut from the top if time slips)

1. Audio cue in the breathing exercise
2. Staff editing of plan item text (keep rule-parameter editing)
3. 3D body highlighting (keep a list view)
4. Roster add and deactivate (keep view and roles)
5. Reduce crew from 4 to 3

**Never cut:** the interaction engine, the "why this fired" panel, crew check-in, the alert triage queue, the plan with adherence, the evidence page, the simulated and not-a-medical-device labelling, the attributions.

---

## 11. Submission checklist

- [ ] `LICENSE` kept; `THIRD_PARTY_NOTICES.md` credits AstroBone and any CC assets
- [ ] README: attributions, limitations (local data, demo login), sources
- [ ] `docs/COMPLIANCE.md` records the event-terms checks (originality, AI-use disclosure)
- [ ] `docs/AI_USE.md` written if required
- [ ] Public URL works offline after one visit; crew app installable on a phone
- [ ] 2-minute video uploaded and linked
- [ ] Deck updated; hardware and real backend only on the roadmap slide
- [ ] Project submitted on the Space Apps Project tab and verified before **Sunday 23:59 local time**
