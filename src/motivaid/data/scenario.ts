// SIMULATED mission script (Master Brief section 9). Deterministic: the same day always gives the same values.
// Hero crew member C1: days 1-12 stable; from day 13 sleep drops and stress rises; day 20 resting heart rate rises;
// days 21-24 recover toward baseline (when the plan is followed). The other three crew stay steady.

import { CREW } from './accounts'
import type { CheckIn } from './types'

export const HERO_ID = 'C1'
export const SCENARIO_DAYS = 30
/** Days already in the store when it is first seeded. "Today" is the day after. */
export const SEEDED_THROUGH = 20
/** Day 21 ("today" after seeding) falls on 14 Nov 2026, the hackathon weekend. */
export const MISSION_START = '2026-10-25T07:00:00.000Z'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round = (v: number, step: number) => Math.round(v / step) * step

interface Usual {
  sleep: number
  hr: number
  reaction: number
  exercise: number
}
const USUAL: Record<string, Usual> = {
  C1: { sleep: 7.2, hr: 58, reaction: 285, exercise: 120 },
  C2: { sleep: 6.9, hr: 62, reaction: 300, exercise: 110 },
  C3: { sleep: 7.4, hr: 60, reaction: 290, exercise: 115 },
  C4: { sleep: 6.8, hr: 64, reaction: 310, exercise: 125 },
}

/** How far the hero has drifted on a day: 0 = usual, 1 = worst (around day 20). */
function heroStrain(day: number): number {
  if (day <= 12) return 0
  if (day <= 20) return (day - 12) / 8
  if (day <= 24) return Math.max(0, 1 - (day - 20) / 4)
  return 0
}

export function scenarioCheckIn(crewId: string, day: number): CheckIn {
  const r = rng(crewId.charCodeAt(1) * 1000 + day)
  const n = (size: number) => (r() - 0.5) * 2 * size
  const u = USUAL[crewId] ?? USUAL.C3
  const s = crewId === HERO_ID ? heroStrain(day) : 0
  const hrUp = crewId === HERO_ID && day >= 20 && day <= 23 ? 9 * (day === 20 ? 1 : 1 - (day - 20) / 4) : 0
  return {
    crewId,
    missionDay: day,
    date: new Date(Date.parse(MISSION_START) + (day - 1) * 86_400_000).toISOString(),
    sleepHours: clamp(round(u.sleep - 2 * s + n(0.3), 0.25), 3, 10),
    sleepQuality: clamp(Math.round(4 - 2 * s + n(0.5)), 1, 5),
    fatigue: clamp(Math.round(2 + 3 * s + n(0.5)), 1, 7),
    mood: clamp(Math.round(4 - 1.5 * s + n(0.5)), 1, 5),
    stress: clamp(Math.round(2 + 2.2 * s + n(0.5)), 1, 5),
    socialContact: clamp(Math.round(4 - 1 * s + n(0.5)), 1, 5),
    confinementStrain: clamp(Math.round(2 + 1.5 * s + n(0.5)), 1, 5),
    restingHr: Math.round(u.hr + hrUp + n(1.5)),
    reactionMedianMs: Math.round(u.reaction + 40 * s + n(10)),
    exerciseMin: clamp(round(u.exercise - 40 * s + n(10), 5), 0, 300),
    redFlags: [],
    source: 'simulated',
  }
}

/** The seed for the store: every crew member, days 1..SEEDED_THROUGH. */
export function seedCheckIns(): CheckIn[] {
  return CREW.flatMap((c) => Array.from({ length: SEEDED_THROUGH }, (_, i) => scenarioCheckIn(c.id, i + 1)))
}

/**
 * History for the day scrubber: the stored check-ins up to `day`, with the scripted scenario filling any day
 * after the store's today (marked source 'simulated'). Lets the demo play days 21-30 (recovery) ahead of time.
 */
export function playbackHistory(stored: CheckIn[], crewId: string, day: number, storeToday: number): CheckIn[] {
  const byDay = new Map<number, CheckIn>()
  for (const c of stored) if (c.crewId === crewId && c.missionDay <= day) {
    const prev = byDay.get(c.missionDay)
    if (!prev || c.date >= prev.date) byDay.set(c.missionDay, c)
  }
  for (let d = storeToday; d <= Math.min(day, SCENARIO_DAYS); d++) if (!byDay.has(d)) byDay.set(d, scenarioCheckIn(crewId, d))
  return [...byDay.values()].sort((a, b) => a.missionDay - b.missionDay)
}
