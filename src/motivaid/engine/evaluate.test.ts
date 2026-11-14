import { describe, expect, it } from 'vitest'
import { HERO_ID, scenarioCheckIn } from '../data/scenario'
import type { CheckIn } from '../data/types'
import { baselinesFor, effectiveRuleset, evaluate, worstSeverity } from './evaluate'

const steady = (crewId: string, day: number, over: Partial<CheckIn> = {}): CheckIn => ({
  crewId, missionDay: day, date: `2026-11-${String(day).padStart(2, '0')}T07:00:00.000Z`,
  sleepHours: 7 + (day % 2) * 0.25, sleepQuality: 4, fatigue: 2 + (day % 2), mood: 4, stress: 2 + (day % 2) * 0.5 > 2.4 ? 3 : 2,
  socialContact: 4, confinementStrain: 2, restingHr: 58 + (day % 3), reactionMedianMs: 290 + (day % 3) * 5, exerciseMin: 120,
  redFlags: [], source: 'simulated', ...over,
})
/** 7 steady baseline days, then the given days. */
const run = (later: Partial<CheckIn>[]) => {
  const h = Array.from({ length: 7 }, (_, i) => steady('X', i + 1))
  later.forEach((o, i) => h.push(steady('X', 8 + i, o)))
  return h
}
const ids = (h: CheckIn[]) => evaluate(h, baselinesFor(h)).map((f) => f.id)
const loop = { sleepHours: 5, stress: 5 }

describe('LOOP-SLEEP-STRESS', () => {
  it('fires after 4 days of low sleep and high stress', () => {
    expect(ids(run([loop, loop, loop, loop]))).toContain('LOOP-SLEEP-STRESS')
  })
  it('does not fire after only 3 days, or with a gap', () => {
    expect(ids(run([loop, loop, loop]))).not.toContain('LOOP-SLEEP-STRESS')
    expect(ids(run([loop, loop, {}, loop, loop]))).not.toContain('LOOP-SLEEP-STRESS')
  })
  it('does not fire on low sleep alone', () => {
    const s = { sleepHours: 5 }
    expect(ids(run([s, s, s, s]))).toHaveLength(0)
  })
  it('carries evidence rows with value, baseline mean and SDs', () => {
    const h = run([loop, loop, loop, loop])
    const f = evaluate(h, baselinesFor(h))[0]
    expect(f.evidence.map((e) => e.indicator)).toEqual(['sleepHours', 'stress'])
    expect(f.evidence[0].deltaSd).toBeGreaterThan(1)
    expect(f.demoParameter).toBe(true)
    expect(f.sourceIds).toEqual(['barger2014', 'basner2014'])
  })
})

describe('LOOP-STRAIN-HEART', () => {
  const strain = { ...loop, restingHr: 75 }
  it('replaces the sleep-stress finding when resting heart rate is up too (act)', () => {
    const f = evaluate(run([loop, loop, loop, strain]), baselinesFor(run([loop, loop, loop, strain])))
    expect(f.map((x) => x.id)).toEqual(['LOOP-STRAIN-HEART'])
    expect(f[0].severity).toBe('act')
    expect(f[0].domains).toEqual(['SLEEP', 'MIND', 'HEART'])
  })
  it('does not fire on a high heart rate without the loop', () => {
    expect(ids(run([{ restingHr: 75 }, { restingHr: 75 }, { restingHr: 75 }, { restingHr: 75 }]))).not.toContain('LOOP-STRAIN-HEART')
  })
  it('escalates when it lasts 4 days', () => {
    const h = run([strain, strain, strain, strain])
    expect(worstSeverity(evaluate(h, baselinesFor(h)))).toBe('escalate')
  })
})

describe('ISOLATION-DRIFT', () => {
  const drift = [4, 4, 3, 3, 2, 2, 1].map((v) => ({ socialContact: v, mood: v }))
  it('fires when social contact and mood both slide down', () => {
    expect(ids(run(drift))).toContain('ISOLATION-DRIFT')
  })
  it('does not fire when only one of them slides', () => {
    expect(ids(run(drift.map((d) => ({ socialContact: d.socialContact }))))).not.toContain('ISOLATION-DRIFT')
  })
})

describe('FATIGUE-PERFORMANCE', () => {
  const tired = { fatigue: 6, reactionMedianMs: 380 }
  it('fires after 2 days of high fatigue and slow reactions', () => {
    expect(ids(run([tired, tired]))).toContain('FATIGUE-PERFORMANCE')
  })
  it('does not fire on fatigue alone or without a reaction test', () => {
    expect(ids(run([{ fatigue: 6 }, { fatigue: 6 }]))).not.toContain('FATIGUE-PERFORMANCE')
    expect(ids(run([{ fatigue: 6, reactionMedianMs: undefined }, { fatigue: 6, reactionMedianMs: undefined }]))).not.toContain('FATIGUE-PERFORMANCE')
  })
})

describe('RED-FLAG', () => {
  it('overrides everything: first, escalate, even with no baseline yet', () => {
    const h = [steady('X', 1, { redFlags: ['chest-pain'] })]
    const f = evaluate(h, baselinesFor(h))
    expect(f[0].id).toBe('RED-FLAG')
    expect(f[0].severity).toBe('escalate')
    expect(f[0].explanation).toContain('Chest pain')
  })
  it('comes before other findings', () => {
    const h = run([loop, loop, loop, { ...loop, redFlags: ['faint'] }])
    expect(ids(h)[0]).toBe('RED-FLAG')
    expect(ids(h)).toContain('LOOP-SLEEP-STRESS')
  })
  it('does not fire without a red flag', () => {
    expect(ids(run([{}]))).not.toContain('RED-FLAG')
  })
})

describe('effectiveRuleset (staff overrides)', () => {
  it('applies overrides and clamps them to the allowed range', () => {
    const r = effectiveRuleset([{ ruleId: 'LOOP-SLEEP-STRESS', params: { days: 2, sleepSdBelow: 99 }, editedById: 'C2', editedAt: '' }])
    expect(r['LOOP-SLEEP-STRESS'].days).toBe(2)
    expect(r['LOOP-SLEEP-STRESS'].sleepSdBelow).toBe(3)
  })
  it('a lower day count makes the loop fire sooner', () => {
    const h = run([loop, loop])
    expect(evaluate(h, baselinesFor(h)).map((f) => f.id)).not.toContain('LOOP-SLEEP-STRESS')
    const r = effectiveRuleset([{ ruleId: 'LOOP-SLEEP-STRESS', params: { days: 2 }, editedById: 'C2', editedAt: '' }])
    expect(evaluate(h, baselinesFor(h), r).map((f) => f.id)).toContain('LOOP-SLEEP-STRESS')
  })
})

describe('demo scenario (brief section 9)', () => {
  const at = (crewId: string, day: number) => {
    const h = Array.from({ length: day }, (_, i) => scenarioCheckIn(crewId, i + 1))
    return evaluate(h, baselinesFor(h)).map((f) => f.id)
  }
  it('hero: nothing before day 17, LOOP-SLEEP-STRESS on day 17, LOOP-STRAIN-HEART on day 20', () => {
    for (let d = 1; d <= 16; d++) expect(at(HERO_ID, d)).toEqual([])
    expect(at(HERO_ID, 17)).toContain('LOOP-SLEEP-STRESS')
    expect(at(HERO_ID, 19)).not.toContain('LOOP-STRAIN-HEART')
    expect(at(HERO_ID, 20)).toContain('LOOP-STRAIN-HEART')
  })
  it('hero recovers by day 24', () => {
    expect(at(HERO_ID, 24)).toEqual([])
  })
  it('the other crew never trigger a rule', () => {
    for (const c of ['C2', 'C3', 'C4']) for (let d = 1; d <= 30; d++) expect(at(c, d)).toEqual([])
  })
})

describe('playbackHistory', async () => {
  const { playbackHistory, seedCheckIns } = await import('../data/scenario')
  it('uses stored days, then the script after today', () => {
    const h = playbackHistory(seedCheckIns(), HERO_ID, 24, 21)
    expect(h.map((c) => c.missionDay)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1))
    expect(evaluate(h, baselinesFor(h))).toEqual([])
  })
})
