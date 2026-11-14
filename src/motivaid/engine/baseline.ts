// Personal baselines and per-indicator status. Pure functions: input in, result out. No DOM, no storage.

import { INDICATOR } from '../data/indicators'
import { BASELINE_PARAMS, STATUS_PARAMS } from '../data/parameters'
import type { Baseline, CheckIn, IndicatorId } from '../data/types'

const usable = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** One crew member's check-ins, oldest first, at most one per mission day (the latest entry wins). */
export function historyFor(checkIns: CheckIn[], crewId: string, uptoDay = Infinity): CheckIn[] {
  const byDay = new Map<number, CheckIn>()
  for (const c of checkIns) {
    if (c.crewId !== crewId || c.missionDay > uptoDay) continue
    const prev = byDay.get(c.missionDay)
    if (!prev || c.date >= prev.date) byDay.set(c.missionDay, c)
  }
  return [...byDay.values()].sort((a, b) => a.missionDay - b.missionDay)
}

/**
 * Personal baseline for one indicator: mean and SD over the first `windowDays` mission days.
 * Returns null until there are at least `minCheckIns` usable values.
 */
export function computeBaseline(history: CheckIn[], indicator: IndicatorId, params: { minCheckIns: number; windowDays: number } = BASELINE_PARAMS): Baseline | null {
  const values = history.filter((c) => c.missionDay <= params.windowDays).map((c) => c[indicator]).filter(usable)
  if (values.length < params.minCheckIns) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const sd = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1))
  return { indicator, mean, sd, n: values.length }
}

export type IndicatorStatus = 'baseline' | 'ok' | 'watch' | 'act'

export interface StatusResult {
  status: IndicatorStatus
  /** How many SDs worse than baseline (negative = better than usual). Null while the baseline builds. */
  deltaSd: number | null
}

/** Compare one value with the personal baseline. "baseline" means not enough data yet. */
export function indicatorStatus(value: number, baseline: Baseline | null, params: { watchSd: number; actSd: number } = STATUS_PARAMS): StatusResult {
  if (!baseline) return { status: 'baseline', deltaSd: null }
  const def = INDICATOR[baseline.indicator]
  const sd = Math.max(baseline.sd, def.sdFloor)
  const deltaSd = ((value - baseline.mean) / sd) * def.worse
  const status = deltaSd >= params.actSd ? 'act' : deltaSd >= params.watchSd ? 'watch' : 'ok'
  return { status, deltaSd }
}

/** Mission days since the latest check-in that has this indicator (0 = today). Null if never measured. */
export function dataAgeDays(history: CheckIn[], indicator: IndicatorId, today: number): number | null {
  for (let i = history.length - 1; i >= 0; i--) if (usable(history[i][indicator])) return today - history[i].missionDay
  return null
}

/** Consecutive days with a check-in, counting back from today (or yesterday if today is not done yet). */
export function checkInStreak(history: CheckIn[], today: number): number {
  const days = new Set(history.map((c) => c.missionDay))
  let d = days.has(today) ? today : today - 1
  let n = 0
  while (days.has(d)) {
    n++
    d--
  }
  return n
}
