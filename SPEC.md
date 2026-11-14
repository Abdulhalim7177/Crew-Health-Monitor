> **Base change (2026-11-14).** The owner of Crew-Health-Monitor gave written permission to use and modify it (see `docs/PERMISSIONS.md`), so MotivAid is built on Crew-Health-Monitor, **not** AstroBone. Where this spec says AstroBone, read Crew-Health-Monitor. Where it says `.js`, use `.ts` (the stack is React + TypeScript + Vite + Tailwind + three.js, with a Node + SQLite API). Section 2 rule 2 no longer applies to Crew-Health-Monitor; it still applies to VITALS.

# MotivAid — Build Spec (NASA Space Apps Challenge 2026)

Challenge: **Create Health Monitoring Software for Astronauts on Space Missions** (Intermediate; Human Exploration, Software, Space Exploration).
Deadline: submissions close **Sunday 15 Nov 2026, 23:59 local time**. Plan to submit by ~20:00 Sunday.
Builder: one person, with three coding agents (Claude Code, opencode, Kilo Code) working on separate branches.

Put this file at the repo root as `SPEC.md` and add a short `AGENTS.md` that points to it.

---

## 1. What we are building

**MotivAid** is an offline-first, astronaut-facing web app (PWA) for **self-assessment of health, with a MIND-first focus**. It gathers daily indicators, compares each astronaut with their own baseline, explains how stress, sleep, heart signals and social connection affect each other, and gives a personalised, evidence-cited plan and a clear escalation path.

The brief asks for a *visual tool that helps astronauts assess their own health and provides guidance on treatments and health improvements*. Any input type is allowed. The brief's suggested features: clickable body figure, dynamic charts, colour coding, prompts for routine measurements, gamification, simple explanations for non-experts, different environments (spacecraft, station, rover, surface base).

### Headline differentiators (the reason to pick us over similar entries)
1. **Cross-domain interaction engine** — detects and explains patterns *across* HEART, SLEEP and MIND (for example sleep down + stress up + resting heart rate up), instead of flagging each indicator alone. Visualised as a lit-up loop.
2. **Behavioural and psychosocial depth** — mood, stress, isolation and confinement, social contact, as first-class signals.
3. **Personalised intervention plan with adherence** — approved, cited guidance (sleep, breathing, social connection), streaks, and an escalation ladder.
4. **Evidence and honesty** — every rule cites a source or is labelled `Demo parameter`; real vs simulated data is always labelled.

### Non-goals (roadmap only, show on one slide, do NOT build)
Wearable hardware (ESP32, MAX30102, GSR, cortisol biosensor, etc.), BLE, cloud AI backend, real clinician web dashboard, camera or voice emotion detection, free-form LLM advice.

---

## 2. Licence and attribution rules (hard rules for every agent)

1. **Base code = AstroBone** (https://github.com/mysunatislam/astrobone-space-apps-2026, **MIT**). Fork or clone it into a NEW repo. Keep its `LICENSE`, keep its copyright notice, add `THIRD_PARTY_NOTICES.md` crediting it, and credit it in the README and the pitch.
2. **Clean-room rule for Crew-Health-Monitor and VITALS.** Neither repo states a licence, so default copyright applies. **Do not clone, open, read, copy or paste their code, text, layouts or assets.** Concepts and ideas are free to use; the concept descriptions in section 4 are all you need. If the owner later grants written permission, that can change.
3. **Assets**: fetch any 3D or anatomy assets from their *original* sources, keep their licences and attribution. Be aware that AstroBone's anatomy assets are CC BY-SA (share-alike); keep that notice on those assets.
4. Check the **event terms** for (a) originality rules about building on another entry and (b) any requirement to disclose AI-tool use. Record the result in `docs/COMPLIANCE.md`. If AI-use disclosure is required, write `docs/AI_USE.md`.
5. Never claim the app is a medical device, diagnoses, or has been validated. State this in the UI footer and README.

---

## 3. Honesty rules

- All astronaut data is **simulated** and labelled "Simulated" in the UI wherever it appears.
- Every threshold is either (a) linked to a source in `src/motivaid/data/sources.js`, or (b) flagged `demoParameter: true` and shown as "Demo parameter" in the UI.
- Only add an "Earth reference vs spaceflight-adjusted" comparison for an indicator when you have a verified source for the spaceflight adjustment. Otherwise show a single rule.
- Guidance text is `contentStatus: "demo wording"` unless sourced.
- No network calls at runtime. The app must work offline after first load.
- Do not invent references. The only citations pre-approved for this spec are listed in section 6; anything else must be looked up and verified before it goes in.

---

## 4. Concepts to implement (written clean-room)

Build these in our own code and our own visual style:

| Concept | Description |
|---|---|
| Signal card | Indicator name, current value, status colour (green / amber / red plus a text label, never colour alone), a **hazard chip**, a one-sentence plain-language reason, a next step, and "data age". |
| Hazard tagging | Every signal and finding links to one of NASA's five spaceflight hazards: radiation, isolation and confinement, distance from Earth, gravity fields, hostile closed environment. |
| Body view | Reuse AstroBone's MIT 3D twin (or a simple 2D body). Regions highlight when a finding touches them. A mind and social "region" panel is needed since the MIND signals are not organs. |
| Role view toggle | Crew member / crew medical officer / flight surgeon. Display-only toggle that changes how much detail and which actions are shown (label it "demo roles"). |
| Earth link delay | A simulated message to the flight surgeon with a countdown. Demo only. |
| Offline handbook (stretch) | Search over approved guidance and rules only. If nothing matches, it answers "I don't have that". |

---

## 5. Tech approach

- Keep AstroBone's stack: Vite, ES modules, three.js, service worker. **Step 0 of Sprint 0 is to inspect the repo and write `docs/ARCHITECTURE.md`** mapping the real file layout; do not assume folder names.
- New code lives under `src/motivaid/`:
  - `engine/` — pure functions, no DOM, fully unit-tested
  - `data/` — simulated mission data, rule definitions, sources, plan content
  - `ui/` — components and pages
- Prefer plain, readable code. Each engine function: input in, findings out, no side effects.
- Remove the Android, companion, local-LLM, and heavy ML parts from the fork unless the app needs them. Record deletions in the changelog.
- Deploy target: GitHub Pages or Vercel (whichever is quicker). A public URL must exist from Sprint 0 onward.

### Agent ownership (one branch per agent, merge only when the sprint build passes)
| Agent | Owns |
|---|---|
| Claude Code | `src/motivaid/engine/`, `src/motivaid/data/`, data model, rules |
| opencode | `src/motivaid/ui/`, styles, charts, body view, loop visual |
| Kilo Code | tests, CI, docs, README, deploy config, compliance and notices |

If two agents need the same file, the owner changes it and the other asks via the sprint notes (`docs/SPRINT_NOTES.md`).

---

## 6. Data model (JSDoc / JSON)

```js
/** @typedef {'HEART'|'SLEEP'|'MIND'} Domain */
/** @typedef {'radiation'|'isolation_confinement'|'distance_from_earth'|'gravity_fields'|'hostile_closed_environment'} Hazard */
/** @typedef {'ok'|'watch'|'act'|'escalate'} Severity */

/** One daily check-in. Map to AstroBone's existing fields first; add only what is missing. */
/**
 * @typedef {Object} CheckIn
 * @property {number} missionDay
 * @property {string} date                 // ISO
 * @property {number} sleepHours
 * @property {number} sleepQuality         // 1-5
 * @property {number} fatigue              // 1-7 (Samn-Perelli, if present in the fork)
 * @property {number} mood                 // 1-5
 * @property {number} stress               // 1-5
 * @property {number} socialContact        // 1-5 (quality/amount of contact with crew or family)
 * @property {number} confinementStrain    // 1-5 (feeling cramped, irritable, restless)
 * @property {number} restingHr            // bpm
 * @property {number} [reactionMedianMs]   // from the fork's reaction test, optional
 * @property {number} [exerciseMin]
 * @property {string[]} redFlags           // symptom checklist ids; any present = override
 * @property {'simulated'|'user'} source
 */

/** Personal baseline per indicator, built after >= 3 usable check-ins (reuse the fork's method). */
/** @typedef {{indicator:string, mean:number, sd:number, n:number}} Baseline */

/**
 * @typedef {Object} Finding
 * @property {string} id                  // e.g. 'LOOP-SLEEP-STRESS'
 * @property {Domain[]} domains
 * @property {Hazard} hazard
 * @property {Severity} severity
 * @property {string} title
 * @property {string} explanation         // plain language, why it fired
 * @property {{indicator:string,value:number,baselineMean:number,deltaSd:number}[]} evidence
 * @property {string[]} sourceIds         // keys into sources.js
 * @property {boolean} demoParameter      // true if any threshold is unsourced
 * @property {string} nextStep
 */

/** @typedef {{id:string, title:string, type:'sleep'|'breathing'|'social'|'movement'|'reflect', durationMin:number, rationale:string, sourceIds:string[], contentStatus:'demo wording'|'sourced'}} PlanItem */
```

### Pre-approved sources (`src/motivaid/data/sources.js`)
- `engel1977` — Engel, G. L. (1977). The need for a new medical model. *Science*, 196(4286), 129–136. https://doi.org/10.1126/science.847460
- `barger2014` — Barger et al. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight: An observational study. *The Lancet Neurology*, 13(9), 904–912. https://doi.org/10.1016/S1474-4422(14)70122-X
- `basner2014` — Basner et al. (2014). Psychological and behavioral changes during confinement in a 520-day simulated interplanetary mission to Mars. *PLOS ONE*, 9(3), e93298. https://doi.org/10.1371/journal.pone.0093298
- `mendes2024` — Mendes Zambetta et al. (2024). Cardiovascular adaptations associated with spaceflight and simulated weightlessness. *Frontiers in Physiology*. https://doi.org/10.3389/fphys.2024.1438089
- `hrp-hazards` — NASA Human Research Program, Five Hazards of Human Spaceflight: https://www.nasa.gov/hrp/hazards/
- `hrp-risks` — NASA Human Research Program, Risks of Human Spaceflight: https://www.nasa.gov/hrp/risks/

(The OSDR datasets already in the fork, such as OSD-575, OSD-569, OSD-656, OSD-804, OSD-435, are used by AstroBone for prioritisation context. Re-check what each file supports before citing it for a new claim.)

---

## 7. Rules engine (Sprint 2 core)

`evaluate(history, baselines, ruleset) -> Finding[]`, pure and deterministic.

Initial rules. **All numeric thresholds are parameters in one file and are `demoParameter: true` unless a source is added.** Express them relative to the personal baseline (for example "at least 1 SD below baseline for 3 consecutive days"), not as absolute medical cutoffs.

| Rule id | Fires when | Domains | Hazard | Sources |
|---|---|---|---|---|
| `LOOP-SLEEP-STRESS` | Sleep hours below baseline and stress above baseline for N consecutive days | SLEEP, MIND | isolation_confinement | barger2014, basner2014 |
| `LOOP-STRAIN-HEART` | The above plus resting HR above baseline | SLEEP, MIND, HEART | isolation_confinement | barger2014, mendes2024 |
| `ISOLATION-DRIFT` | Social contact trending down and mood trending down over N days | MIND | isolation_confinement | basner2014 |
| `FATIGUE-PERFORMANCE` | Fatigue up and reaction-test slowing versus baseline | SLEEP, MIND | hostile_closed_environment | barger2014 |
| `RED-FLAG` | Any red-flag symptom present | any | any | hrp-risks |

Severity ladder and actions:
- `ok` — keep routine.
- `watch` — show finding, add plan items.
- `act` — strongly suggested plan items, notify crew medical officer (simulated).
- `escalate` — message the flight surgeon (simulated delay), show approved-emergency placeholder text labelled "demo wording".

`RED-FLAG` always overrides everything else, as in the fork.

---

## 8. Sprints

Times are Africa/Lagos. Every sprint ends with: **tests green, deployed URL working, a 30-second screen recording or screenshot saved in `docs/progress/`.** If a sprint slips, use the cut list in section 10.

### Sprint 0 — Foundation (Sat 14:20–15:30)
**Goal:** fork running at a public URL, rebranded.
- Fork AstroBone into a new repo. Keep `LICENSE`. Add `THIRD_PARTY_NOTICES.md`.
- Inspect the repo, write `docs/ARCHITECTURE.md` (real layout, how data is loaded, how tests run, how to build).
- Remove the Android, companion, Llama and other heavy optional parts that are off by default.
- Rebrand to MotivAid (name, tagline, colours, footer disclaimer: simulated data, not a medical device).
- Create `SPEC.md`, `AGENTS.md`, `docs/COMPLIANCE.md` (event-terms checks), `docs/SPRINT_NOTES.md`.
- Deploy.
**Done when:** public URL loads offline after one visit; existing tests still pass.

**Paste-ready prompt (Kilo Code, then Claude Code):**
> Read SPEC.md sections 2, 5 and 8 (Sprint 0). Inspect this repo and write docs/ARCHITECTURE.md describing the real file layout, data loading, test command and build command. Do not assume folder names. Then remove the Android, companion and local-LLM parts that are off by default, keeping the build and tests green. Add THIRD_PARTY_NOTICES.md crediting AstroBone (MIT) and keep LICENSE. Do not touch src outside what removal requires.

### Sprint 1 — MIND check-in and trends (Sat 15:30–19:30)
**Goal:** check-in → stored → trends and traffic lights against personal baseline.
- Map existing check-in fields (see section 6); add only missing ones: mood, stress, socialContact, confinementStrain.
- Simulated mission generator: a 30-day astronaut with a scripted scenario (see section 9). Labelled "Simulated".
- Signal cards (section 4), trend charts, colour plus text status, hazard chips.
- Mission-routine prompts: a "Today" panel listing due check-ins.
**Done when:** you can complete a check-in, see updated cards and a trend chart, and every card shows its hazard chip and data age.

**Prompt (Claude Code):**
> Read SPEC.md sections 3, 6 and 8 (Sprint 1). In src/motivaid/engine and src/motivaid/data: extend the check-in model with mood, stress, socialContact and confinementStrain, reusing the fork's existing baseline code. Add a deterministic 30-day simulated mission generator with a scripted scenario and a fixed seed. Pure functions, unit tests, no DOM.

**Prompt (opencode):**
> Read SPEC.md sections 3, 4 and 8 (Sprint 1). Build the signal card component and trend charts in src/motivaid/ui using the engine's outputs. Status must use a colour AND a text label. Show a hazard chip and data age on every card. Mark simulated data. Write your own code; follow the concept table in section 4 only.

### Sprint 2 — Interaction engine and loop visual (Sat 19:30–00:30)
**Goal:** the headline feature works.
- Implement the rules in section 7 as pure, tested functions. Thresholds in one parameters file.
- "Why this fired" panel: evidence rows (value, baseline, deviation), plain-language text, source links, "Demo parameter" badge where relevant.
- HEART–SLEEP–MIND loop visual: three nodes, edges light up according to findings, click a node to see its findings.
- Scenario playback: scrub through mission days; the loop fires at the scripted day.
**Done when:** playing the scripted scenario makes `LOOP-SLEEP-STRESS` fire, then `LOOP-STRAIN-HEART`, with correct explanations; unit tests cover each rule including "does not fire" cases and the red-flag override.

**Prompt (Claude Code):**
> Read SPEC.md sections 3, 6, 7 and 8 (Sprint 2). Implement evaluate(history, baselines, ruleset) and the five rules in section 7 as pure functions with thresholds in a single parameters file, all marked demoParameter unless sourced. Each Finding must carry evidence rows, sourceIds and a plain-language explanation. Add tests for fire, no-fire and RED-FLAG override.

**Prompt (opencode):**
> Read SPEC.md sections 4 and 8 (Sprint 2). Build the "Why this fired" panel and the HEART–SLEEP–MIND loop visual driven by Finding[]. Add a day scrubber for scenario playback. Nodes and edges must be keyboard accessible and not rely on colour alone.

### Sprint 3 — Coach, adherence, escalation (Sun 08:00–12:00)
**Goal:** from finding to action.
- Plan generator: finding → 1–4 `PlanItem`s from approved content in `src/motivaid/data/plan.js` (sleep wind-down, paced breathing with visual timer and optional audio cue, social-connection prompt, movement break, short reflection). Each has a rationale and source or "demo wording".
- Adherence: mark items done, streaks, weekly progress rings. Encouraging, no punitive mechanics.
- Escalation ladder (section 7) with the simulated Earth-link delay countdown and role view toggle (section 4).
- Stretch: offline handbook search over approved content.
**Done when:** a firing finding produces a plan; completing items updates adherence; an `escalate` finding shows the delayed message flow; roles change what is visible.

### Sprint 4 — Evidence and credibility (Sun 12:00–15:00)
**Goal:** judges can audit it.
- Evidence page: every rule, its sources, parameters, and which are demo parameters.
- Hazard view: five NASA hazards with the signals mapped to each.
- Data page: what is simulated, what is from NASA OSDR (inherited from the fork), what each is used for.
- Limitations page: not a medical device, not validated, simulated data, hardware is roadmap.
- Summary export: a one-page printable "flight surgeon summary" of the last 7 days.
- Offline check, accessibility pass (contrast, keyboard, text alternatives).
**Done when:** every finding links to its evidence; no claim exists without a source or a "Demo parameter" label.

### Sprint 5 — Polish and submit (Sun 15:00–19:30)
- Demo script rehearsed (section 9); record a clean 2-minute video.
- README: problem, solution, how to run, data and sources, attributions, limitations, roadmap.
- Update the existing MotivAid deck: keep the problem and impact slides; replace the architecture slide with the prototype screenshots; keep the hardware as one roadmap slide.
- Fill in and submit on the Space Apps Project tab (project is submitted from the team's Project tab). Verify the submission afterwards.
**Done when:** submitted, and the live URL and repo link both work. Buffer until 23:59.

---

## 9. Demo scenario (use as the simulated data script)

Mission day 1–30 on a deep-space transit, one astronaut. Days 1–12 stable. From day 13, sleep drops and stress rises; day 17 `LOOP-SLEEP-STRESS` fires; day 20 resting heart rate rises and `LOOP-STRAIN-HEART` fires; the coach suggests a plan; adherence on days 21–24 brings stress and sleep back toward baseline; a separate day shows the escalation path to the flight surgeon with the delay countdown.

2-minute video outline: 0:00 problem (15 s) → 0:15 daily check-in (20 s) → 0:35 loop fires and "why" panel (35 s) → 1:10 coach plan and adherence (25 s) → 1:35 evidence and honesty page (15 s) → 1:50 roadmap and close (10 s).

---

## 10. Cut list (if time slips, cut from the top)

1. Offline handbook search
2. Role view toggle polish
3. Printable summary export
4. 3D body highlighting (keep a simple list view)
5. Audio cue in the breathing exercise

**Never cut:** the interaction engine, the "why this fired" panel, the plan with adherence, the evidence page, the simulated/not-a-medical-device labelling, the attributions.

---

## 11. Submission checklist

- [ ] `LICENSE` kept, `THIRD_PARTY_NOTICES.md` credits AstroBone and any CC assets
- [ ] README attributions, limitations and sources complete
- [ ] `docs/COMPLIANCE.md` records the event-terms checks (originality, AI-use disclosure)
- [ ] `docs/AI_USE.md` written if required
- [ ] Public URL works offline after one visit
- [ ] 2-minute video uploaded and linked
- [ ] Deck updated, hardware only on the roadmap slide
- [ ] Project submitted on the Space Apps Project tab and verified before **Sunday 23:59 local time**
