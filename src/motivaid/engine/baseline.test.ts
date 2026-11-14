import { describe, expect, it } from 'vitest'
import { scenarioCheckIn, HERO_ID } from '../data/scenario'
import type { CheckIn } from '../data/types'
import { checkInStreak, computeBaseline, dataAgeDays, historyFor, indicatorStatus } from './baseline'

const days = (crewId: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => scenarioCheckIn(crewId, from + i))

describe('historyFor', () => {
  it('keeps one check-in per day, the latest, oldest first', () => {
    const a = { ...scenarioCheckIn('C1', 2), date: '2026-11-02T07:00:00.000Z', stress: 1 }
    const b = { ...scenarioCheckIn('C1', 2), date: '2026-11-02T20:00:00.000Z', stress: 5 }
    const h = historyFor([b, scenarioCheckIn('C1', 1), a, scenarioCheckIn('C2', 1)], 'C1')
    expect(h.map((c) => c.missionDay)).toEqual([1, 2])
    expect(h[1].stress).toBe(5)
  })
})

describe('computeBaseline', () => {
  it('needs at least 3 usable check-ins (no-fire)', () => {
    expect(computeBaseline(days('C1', 1, 2), 'sleepHours')).toBeNull()
  })
  it('uses only the first 7 days (fire)', () => {
    const b = computeBaseline(days('C1', 1, 20), 'sleepHours')!
    expect(b.n).toBe(7)
    expect(b.mean).toBeGreaterThan(6.5)
  })
  it('skips missing optional values', () => {
    const h = days('C1', 1, 5).map((c, i) => (i < 3 ? { ...c, reactionMedianMs: undefined } : c)) as CheckIn[]
    expect(computeBaseline(h, 'reactionMedianMs')).toBeNull()
  })
})

describe('indicatorStatus', () => {
  const base = { indicator: 'stress' as const, mean: 2, sd: 0.5, n: 7 }
  it('is "baseline" while the baseline builds', () => {
    expect(indicatorStatus(5, null)).toEqual({ status: 'baseline', deltaSd: null })
  })
  it('stays ok near the usual value (no-fire)', () => {
    expect(indicatorStatus(2.2, base).status).toBe('ok')
  })
  it('watches at 1 SD worse and acts at 2 SD worse (fire)', () => {
    expect(indicatorStatus(2.5, base).status).toBe('watch')
    expect(indicatorStatus(3, base).status).toBe('act')
  })
  it('respects direction: lower sleep is worse, more sleep is fine', () => {
    const sleep = { indicator: 'sleepHours' as const, mean: 7, sd: 0.4, n: 7 }
    expect(indicatorStatus(6, sleep).status).toBe('act')
    expect(indicatorStatus(8, sleep).status).toBe('ok')
  })
  it('uses the SD floor so a flat baseline does not over-react', () => {
    expect(indicatorStatus(2.3, { ...base, sd: 0 }).status).toBe('ok')
  })
})

describe('scenario', () => {
  it('hero is steady to day 12 and worse on sleep and stress by day 17', () => {
    const h = days(HERO_ID, 1, 20)
    const sleep = computeBaseline(h, 'sleepHours')
    const stress = computeBaseline(h, 'stress')
    expect(indicatorStatus(scenarioCheckIn(HERO_ID, 10).sleepHours, sleep).status).toBe('ok')
    expect(indicatorStatus(scenarioCheckIn(HERO_ID, 17).sleepHours, sleep).status).not.toBe('ok')
    expect(indicatorStatus(scenarioCheckIn(HERO_ID, 17).stress, stress).status).not.toBe('ok')
  })
  it('hero resting heart rate rises on day 20, not before day 19', () => {
    const hr = computeBaseline(days(HERO_ID, 1, 20), 'restingHr')
    expect(indicatorStatus(scenarioCheckIn(HERO_ID, 18).restingHr, hr).status).toBe('ok')
    expect(indicatorStatus(scenarioCheckIn(HERO_ID, 20).restingHr, hr).status).toBe('act')
  })
  it('other crew stay ok on stress through day 20', () => {
    const h = days('C3', 1, 20)
    const b = computeBaseline(h, 'stress')
    expect(h.filter((c) => indicatorStatus(c.stress, b).status === 'act')).toHaveLength(0)
  })
})

describe('dataAgeDays and checkInStreak', () => {
  const h = [1, 2, 4, 5].map((d) => scenarioCheckIn('C3', d))
  it('reports days since the last value', () => {
    expect(dataAgeDays(h, 'sleepHours', 6)).toBe(1)
    expect(dataAgeDays([], 'sleepHours', 6)).toBeNull()
  })
  it('counts consecutive days, allowing today to be pending', () => {
    expect(checkInStreak(h, 5)).toBe(2)
    expect(checkInStreak(h, 6)).toBe(2)
    expect(checkInStreak(h, 7)).toBe(0)
  })
})
