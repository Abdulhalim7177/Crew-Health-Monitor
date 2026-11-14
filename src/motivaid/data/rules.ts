// Rule definitions for the interaction engine (Master Brief section 7).
// Every numeric threshold is a parameter here, relative to the person's own baseline, and every one is a
// demo parameter: the sources explain why these signals matter, they do not give these cut-offs.
// `range` is what staff may set in the console (Sprint 4); edits outside it are clamped.

import type { Domain, Hazard, Severity } from './types'

export type RuleId = 'LOOP-SLEEP-STRESS' | 'LOOP-STRAIN-HEART' | 'ISOLATION-DRIFT' | 'FATIGUE-PERFORMANCE' | 'RED-FLAG'

export interface ParamDef {
  value: number
  range: [number, number]
  label: string
}

export interface RuleDef {
  id: RuleId
  title: string
  domains: Domain[]
  hazard: Hazard
  severity: Severity
  sourceIds: string[]
  demoParameter: boolean
  params: Record<string, ParamDef>
  /** Plain-language explanation shown in "Why this fired". Demo wording. */
  explanation: string
  /** Demo wording. */
  nextStep: string
}

export const RULES: Record<RuleId, RuleDef> = {
  'LOOP-SLEEP-STRESS': {
    id: 'LOOP-SLEEP-STRESS',
    title: 'Sleep down, stress up',
    domains: ['SLEEP', 'MIND'],
    hazard: 'isolation_confinement',
    severity: 'watch',
    sourceIds: ['barger2014', 'basner2014'],
    demoParameter: true,
    params: {
      sleepSdBelow: { value: 1, range: [0.5, 3], label: 'Sleep at least this many SDs below your baseline' },
      stressSdAbove: { value: 1, range: [0.5, 3], label: 'Stress at least this many SDs above your baseline' },
      days: { value: 4, range: [1, 7], label: 'For this many days in a row' },
    },
    explanation: 'You have been sleeping less than usual and feeling more stressed than usual, several days in a row. Short sleep and stress feed each other, so this loop tends to keep going unless something breaks it.',
    nextStep: 'Protect your sleep window tonight and try a few minutes of paced breathing before bed.',
  },
  'LOOP-STRAIN-HEART': {
    id: 'LOOP-STRAIN-HEART',
    title: 'Sleep, stress and heart rate moving together',
    domains: ['SLEEP', 'MIND', 'HEART'],
    hazard: 'isolation_confinement',
    severity: 'act',
    sourceIds: ['barger2014', 'mendes2024'],
    demoParameter: true,
    params: {
      hrSdAbove: { value: 1.5, range: [0.5, 4], label: 'Resting heart rate at least this many SDs above your baseline, while the sleep-stress loop is active' },
      escalateAfterDays: { value: 4, range: [1, 10], label: 'Escalate to the flight surgeon if it lasts this many days' },
    },
    explanation: 'The sleep and stress loop is still running, and now your resting heart rate is higher than usual too. When the body and mind show strain together, it is worth a closer look from the medical officer.',
    nextStep: 'Follow your plan today and talk to the crew medical officer. Re-measure your resting heart rate after five quiet minutes.',
  },
  'ISOLATION-DRIFT': {
    id: 'ISOLATION-DRIFT',
    title: 'Social contact and mood drifting down',
    domains: ['MIND'],
    hazard: 'isolation_confinement',
    severity: 'watch',
    sourceIds: ['basner2014'],
    demoParameter: true,
    params: {
      windowDays: { value: 7, range: [4, 14], label: 'Look at the trend over this many days' },
      slopePerDay: { value: 0.15, range: [0.05, 0.5], label: 'Both falling by at least this many points a day' },
    },
    explanation: 'Over the past days your social contact and your mood have both been sliding down. A slow drift is easy to miss day to day.',
    nextStep: 'Plan some time with the crew today, or record a message for home.',
  },
  'FATIGUE-PERFORMANCE': {
    id: 'FATIGUE-PERFORMANCE',
    title: 'Fatigue up, reactions slower',
    domains: ['SLEEP', 'MIND'],
    hazard: 'hostile_closed_environment',
    severity: 'watch',
    sourceIds: ['barger2014'],
    demoParameter: true,
    params: {
      fatigueSdAbove: { value: 1.5, range: [0.5, 4], label: 'Fatigue at least this many SDs above your baseline' },
      reactionSdAbove: { value: 1.5, range: [0.5, 4], label: 'Reaction time at least this many SDs slower than your baseline' },
      days: { value: 2, range: [1, 7], label: 'For this many days in a row' },
    },
    explanation: 'You feel more tired than usual and your reaction test is slower than usual. Together they suggest fatigue is starting to affect performance.',
    nextStep: 'Take a rest break before safety-critical tasks and tell whoever plans today’s work.',
  },
  'RED-FLAG': {
    id: 'RED-FLAG',
    title: 'Red-flag symptom reported',
    domains: ['HEART', 'SLEEP', 'MIND'],
    // A red flag can come from any system. Tagged "distance from Earth": there is no hospital to go to.
    hazard: 'distance_from_earth',
    severity: 'escalate',
    sourceIds: ['hrp-risks'],
    demoParameter: false,
    params: {},
    explanation: 'You reported a symptom that always needs a person to look at it straight away, whatever your other readings say.',
    nextStep: 'Tell the crew medical officer now. The flight surgeon on Earth has been alerted (demo).',
  },
}

export type Ruleset = Record<RuleId, Record<string, number>>

/** The default parameter values, as the engine takes them. */
export function defaultRuleset(): Ruleset {
  return Object.fromEntries(Object.values(RULES).map((r) => [r.id, Object.fromEntries(Object.entries(r.params).map(([k, p]) => [k, p.value]))])) as Ruleset
}
