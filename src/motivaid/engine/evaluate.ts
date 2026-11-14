// Interaction engine: evaluate(history, baselines, ruleset) -> Finding[]. Pure and deterministic.
// Looks across HEART, SLEEP and MIND together instead of flagging each indicator alone.

import { INDICATORS, RED_FLAGS } from '../data/indicators'
import { RULES, defaultRuleset, type RuleId, type Ruleset } from '../data/rules'
import type { Baseline, CheckIn, Finding, IndicatorId, RuleOverride, Severity } from '../data/types'
import { computeBaseline, indicatorStatus } from './baseline'

export type Baselines = Partial<Record<IndicatorId, Baseline | null>>

/** Baselines for every indicator from one person's history. */
export function baselinesFor(history: CheckIn[]): Baselines {
  return Object.fromEntries(INDICATORS.map((d) => [d.id, computeBaseline(history, d.id)])) as Baselines
}

/** Default parameters with staff overrides applied, each clamped to its allowed range. */
export function effectiveRuleset(overrides: RuleOverride[] = []): Ruleset {
  const set = defaultRuleset()
  for (const o of overrides) {
    const rule = RULES[o.ruleId as RuleId]
    if (!rule) continue
    for (const [k, v] of Object.entries(o.params)) {
      const def = rule.params[k]
      if (def && Number.isFinite(v)) set[rule.id][k] = Math.min(def.range[1], Math.max(def.range[0], v))
    }
  }
  return set
}

const SEVERITY_RANK: Record<Severity, number> = { ok: 0, watch: 1, act: 2, escalate: 3 }
export const worstSeverity = (findings: Finding[]): Severity =>
  findings.reduce<Severity>((w, f) => (SEVERITY_RANK[f.severity] > SEVERITY_RANK[w] ? f.severity : w), 'ok')

/** SDs worse than baseline for one check-in, or null when there is no value or no baseline yet. */
function worseBy(c: CheckIn, id: IndicatorId, baselines: Baselines): number | null {
  const v = c[id]
  const b = baselines[id]
  if (typeof v !== 'number' || !b) return null
  return indicatorStatus(v, b).deltaSd
}

function evidence(c: CheckIn, ids: IndicatorId[], baselines: Baselines): Finding['evidence'] {
  return ids.flatMap((id) => {
    const v = c[id]
    const b = baselines[id]
    const d = worseBy(c, id, baselines)
    return typeof v === 'number' && b && d !== null ? [{ indicator: id, value: v, baselineMean: Math.round(b.mean * 100) / 100, deltaSd: Math.round(d * 100) / 100 }] : []
  })
}

/** Number of consecutive days, ending on the last day, for which `test` holds (one check-in per day, no gaps). */
function runLength(history: CheckIn[], test: (c: CheckIn) => boolean): number {
  let n = 0
  for (let i = history.length - 1; i >= 0; i--) {
    if (i < history.length - 1 && history[i].missionDay !== history[i + 1].missionDay - 1) break
    if (!test(history[i])) break
    n++
  }
  return n
}

/** Least-squares slope (per day) of an indicator over the last `days` check-ins. */
function slope(history: CheckIn[], id: IndicatorId, days: number): number | null {
  const pts = history.slice(-days).flatMap((c) => (typeof c[id] === 'number' ? [[c.missionDay, c[id] as number]] : []))
  if (pts.length < Math.max(3, Math.ceil(days / 2))) return null
  const mx = pts.reduce((a, p) => a + p[0], 0) / pts.length
  const my = pts.reduce((a, p) => a + p[1], 0) / pts.length
  const sxx = pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0)
  return sxx === 0 ? null : pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / sxx
}

function finding(id: RuleId, c: CheckIn, ev: Finding['evidence'], severity: Severity = RULES[id].severity): Finding {
  const r = RULES[id]
  return {
    id,
    crewId: c.crewId,
    missionDay: c.missionDay,
    domains: r.domains,
    hazard: r.hazard,
    severity,
    title: r.title,
    explanation: r.explanation,
    evidence: ev,
    sourceIds: r.sourceIds,
    demoParameter: r.demoParameter,
    nextStep: r.nextStep,
  }
}

/**
 * Evaluate one crew member's check-ins (oldest first, one per day) as of the last check-in.
 * Returns findings, most severe first. A red flag always comes first.
 */
export function evaluate(history: CheckIn[], baselines: Baselines, ruleset: Ruleset = defaultRuleset()): Finding[] {
  const today = history[history.length - 1]
  if (!today) return []
  const out: Finding[] = []

  // RED-FLAG: any red-flag symptom today overrides everything else.
  if (today.redFlags.length > 0) {
    const f = finding('RED-FLAG', today, [])
    const labels = today.redFlags.map((id) => RED_FLAGS.find((r) => r.id === id)?.label ?? id)
    out.push({ ...f, explanation: `${f.explanation} Reported: ${labels.join('; ')}.` })
  }

  // LOOP-SLEEP-STRESS
  const p1 = ruleset['LOOP-SLEEP-STRESS']
  const loopDay = (c: CheckIn) => (worseBy(c, 'sleepHours', baselines) ?? -Infinity) >= p1.sleepSdBelow && (worseBy(c, 'stress', baselines) ?? -Infinity) >= p1.stressSdAbove
  const loopRun = runLength(history, loopDay)
  const loopOn = loopRun >= p1.days

  // LOOP-STRAIN-HEART: the loop plus resting heart rate above baseline today.
  const p2 = ruleset['LOOP-STRAIN-HEART']
  const strainDay = (c: CheckIn) => (worseBy(c, 'restingHr', baselines) ?? -Infinity) >= p2.hrSdAbove
  if (loopOn && strainDay(today)) {
    const strainRun = runLength(history, (c) => loopDay(c) && strainDay(c))
    const severity: Severity = strainRun >= p2.escalateAfterDays ? 'escalate' : 'act'
    out.push(finding('LOOP-STRAIN-HEART', today, evidence(today, ['sleepHours', 'stress', 'restingHr'], baselines), severity))
  } else if (loopOn) {
    out.push(finding('LOOP-SLEEP-STRESS', today, evidence(today, ['sleepHours', 'stress'], baselines)))
  }

  // ISOLATION-DRIFT: social contact and mood both trending down, and both below baseline today.
  const p3 = ruleset['ISOLATION-DRIFT']
  const sSocial = slope(history, 'socialContact', p3.windowDays)
  const sMood = slope(history, 'mood', p3.windowDays)
  if (sSocial !== null && sMood !== null && sSocial <= -p3.slopePerDay && sMood <= -p3.slopePerDay && (worseBy(today, 'socialContact', baselines) ?? 0) > 0 && (worseBy(today, 'mood', baselines) ?? 0) > 0) {
    out.push(finding('ISOLATION-DRIFT', today, evidence(today, ['socialContact', 'mood'], baselines)))
  }

  // FATIGUE-PERFORMANCE
  const p4 = ruleset['FATIGUE-PERFORMANCE']
  const fatigueDay = (c: CheckIn) => (worseBy(c, 'fatigue', baselines) ?? -Infinity) >= p4.fatigueSdAbove && (worseBy(c, 'reactionMedianMs', baselines) ?? -Infinity) >= p4.reactionSdAbove
  if (runLength(history, fatigueDay) >= p4.days) out.push(finding('FATIGUE-PERFORMANCE', today, evidence(today, ['fatigue', 'reactionMedianMs'], baselines)))

  return out.sort((a, b) => (a.id === 'RED-FLAG' ? -1 : b.id === 'RED-FLAG' ? 1 : SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]))
}

/** Findings for one crew member as of a mission day: the convenience the screens use. */
export function evaluateDay(allCheckIns: CheckIn[], crewId: string, day: number, overrides: RuleOverride[] = [], historyFor?: (c: CheckIn[], id: string, d: number) => CheckIn[]): Finding[] {
  const pick = historyFor ?? ((c, id, d) => c.filter((x) => x.crewId === id && x.missionDay <= d).sort((a, b) => a.missionDay - b.missionDay))
  const history = pick(allCheckIns, crewId, day)
  return evaluate(history, baselinesFor(history), effectiveRuleset(overrides))
}
