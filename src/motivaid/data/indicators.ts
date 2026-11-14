// The daily check-in indicators. Hazard tags follow NASA's five hazards (hrp-hazards): sleep, mood and
// behavioural strain sit under "isolation and confinement", the heart under "gravity fields".
// Sources support why each indicator matters in spaceflight. They give no thresholds (see parameters.ts).

import type { Domain, Hazard, IndicatorId } from './types'

export interface IndicatorDef {
  id: IndicatorId
  label: string
  unit: string
  domain: Domain
  hazard: Hazard
  /** +1 when a higher value is worse, -1 when a lower value is worse. */
  worse: 1 | -1
  /** Smallest SD used, so a very steady baseline does not make tiny changes look large. Demo parameter. */
  sdFloor: number
  /** Allowed input range for the check-in form. */
  min: number
  max: number
  step: number
  optional?: boolean
  sourceIds: string[]
  /** Plain-language: why it matters. Demo wording. */
  why: string
  /** Plain-language next step when it is worse than usual. Demo wording. */
  nextStep: string
}

export const INDICATORS: IndicatorDef[] = [
  {
    id: 'sleepHours', label: 'Sleep', unit: 'h', domain: 'SLEEP', hazard: 'isolation_confinement', worse: -1, sdFloor: 0.3, min: 0, max: 14, step: 0.25,
    sourceIds: ['barger2014', 'hrp-hazards'], why: 'Astronauts often sleep less in flight than on the ground.', nextStep: 'Protect your sleep window tonight and keep the sleep station dark and quiet.',
  },
  {
    id: 'sleepQuality', label: 'Sleep quality', unit: '/5', domain: 'SLEEP', hazard: 'isolation_confinement', worse: -1, sdFloor: 0.4, min: 1, max: 5, step: 1,
    sourceIds: ['barger2014', 'hrp-hazards'], why: 'Poor sleep quality adds up even when the hours look fine.', nextStep: 'Try a wind-down routine before sleep.',
  },
  {
    id: 'fatigue', label: 'Fatigue', unit: '/7', domain: 'SLEEP', hazard: 'hostile_closed_environment', worse: 1, sdFloor: 0.5, min: 1, max: 7, step: 1,
    sourceIds: ['barger2014', 'hrp-hazards'], why: 'Fatigue slows reactions and raises the chance of mistakes.', nextStep: 'Plan a short rest break and avoid critical tasks when most tired.',
  },
  {
    id: 'mood', label: 'Mood', unit: '/5', domain: 'MIND', hazard: 'isolation_confinement', worse: -1, sdFloor: 0.4, min: 1, max: 5, step: 1,
    sourceIds: ['basner2014', 'hrp-hazards'], why: 'Long confinement can wear mood down slowly, which is easy to miss day to day.', nextStep: 'Take a few minutes for something you enjoy, and talk to someone.',
  },
  {
    id: 'stress', label: 'Stress', unit: '/5', domain: 'MIND', hazard: 'isolation_confinement', worse: 1, sdFloor: 0.4, min: 1, max: 5, step: 1,
    sourceIds: ['basner2014', 'hrp-hazards'], why: 'Stress and sleep feed each other: each can make the other worse.', nextStep: 'Try a few minutes of slow, paced breathing.',
  },
  {
    id: 'socialContact', label: 'Social contact', unit: '/5', domain: 'MIND', hazard: 'isolation_confinement', worse: -1, sdFloor: 0.4, min: 1, max: 5, step: 1,
    sourceIds: ['basner2014', 'hrp-hazards'], why: 'Feeling cut off is a known strain of isolated missions.', nextStep: 'Share a meal with the crew or send a message home.',
  },
  {
    id: 'confinementStrain', label: 'Confinement strain', unit: '/5', domain: 'MIND', hazard: 'isolation_confinement', worse: 1, sdFloor: 0.4, min: 1, max: 5, step: 1,
    sourceIds: ['basner2014', 'hrp-hazards'], why: 'Living and working in a small space, with no way out, wears on people over time.', nextStep: 'Change your surroundings where you can: a view, music, a different module.',
  },
  {
    id: 'restingHr', label: 'Resting heart rate', unit: 'bpm', domain: 'HEART', hazard: 'gravity_fields', worse: 1, sdFloor: 2, min: 30, max: 140, step: 1,
    sourceIds: ['mendes2024', 'hrp-hazards'], why: 'The heart and blood vessels adapt to weightlessness; a change from your usual rate is worth noticing.', nextStep: 'Re-measure after resting quietly for five minutes.',
  },
  {
    id: 'reactionMedianMs', label: 'Reaction time', unit: 'ms', domain: 'MIND', hazard: 'hostile_closed_environment', worse: 1, sdFloor: 15, min: 150, max: 1000, step: 1, optional: true,
    sourceIds: ['barger2014', 'hrp-hazards'], why: 'Slower reactions can be an early sign of fatigue.', nextStep: 'Repeat the reaction test after a rest.',
  },
  {
    id: 'exerciseMin', label: 'Exercise', unit: 'min', domain: 'HEART', hazard: 'gravity_fields', worse: -1, sdFloor: 5, min: 0, max: 300, step: 5, optional: true,
    sourceIds: ['hrp-hazards'], why: 'Daily exercise protects bone, muscle and the heart in weightlessness.', nextStep: 'Fit in your planned exercise session today.',
  },
]

export const INDICATOR = Object.fromEntries(INDICATORS.map((d) => [d.id, d])) as Record<IndicatorId, IndicatorDef>

/** Red-flag symptoms: any one overrides everything else (RED-FLAG rule). Demo wording. */
export const RED_FLAGS: { id: string; label: string }[] = [
  { id: 'chest-pain', label: 'Chest pain or pressure' },
  { id: 'breathless', label: 'Short of breath at rest' },
  { id: 'faint', label: 'Fainted or nearly fainted' },
  { id: 'vision-headache', label: 'Sudden severe headache or change in vision' },
  { id: 'self-harm', label: 'Thoughts of harming yourself' },
]
