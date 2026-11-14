// MotivAid data model (Master Brief section 6), as TypeScript types.

export type Domain = 'HEART' | 'SLEEP' | 'MIND'
export type Hazard = 'radiation' | 'isolation_confinement' | 'distance_from_earth' | 'gravity_fields' | 'hostile_closed_environment'
export type Severity = 'ok' | 'watch' | 'act' | 'escalate'
export type Role = 'crew' | 'crewMedicalOfficer' | 'flightSurgeon' | 'missionAdmin'

export interface User {
  id: string
  name: string
  role: Role
  /** Job title shown on the login screen. */
  title: string
  crewId?: string
  demoPin: string
}

export interface CrewMember {
  id: string
  name: string
  missionRole: string
  missionId: string
  active: boolean
}

/** One daily check-in. */
export interface CheckIn {
  crewId: string
  missionDay: number
  /** ISO timestamp */
  date: string
  sleepHours: number
  /** 1-5 */
  sleepQuality: number
  /** 1-7, Samn-Perelli fatigue checklist */
  fatigue: number
  /** 1-5 */
  mood: number
  /** 1-5 */
  stress: number
  /** 1-5 */
  socialContact: number
  /** 1-5 */
  confinementStrain: number
  /** beats per minute */
  restingHr: number
  reactionMedianMs?: number
  exerciseMin?: number
  /** Any present = override (RED-FLAG rule, Sprint 2). Ids from RED_FLAGS. */
  redFlags: string[]
  source: 'simulated' | 'user'
}

/** Numeric check-in fields that have a personal baseline. */
export type IndicatorId = 'sleepHours' | 'sleepQuality' | 'fatigue' | 'mood' | 'stress' | 'socialContact' | 'confinementStrain' | 'restingHr' | 'reactionMedianMs' | 'exerciseMin'

export interface Baseline {
  indicator: IndicatorId
  mean: number
  sd: number
  n: number
}

export interface Finding {
  id: string
  crewId: string
  missionDay: number
  domains: Domain[]
  hazard: Hazard
  severity: Severity
  title: string
  explanation: string
  evidence: { indicator: string; value: number; baselineMean: number; deltaSd: number }[]
  sourceIds: string[]
  demoParameter: boolean
  nextStep: string
}

export interface Alert {
  id: string
  findingId: string
  crewId: string
  status: 'new' | 'acknowledged' | 'in_review' | 'resolved'
  assigneeId?: string
  notes: { byId: string; at: string; text: string }[]
}

export interface Message {
  id: string
  fromId: string
  toId: string
  sentAt: string
  deliverAt: string
  body: string
}

export interface RuleOverride {
  ruleId: string
  params: Record<string, number>
  editedById: string
  editedAt: string
}

export interface PlanItem {
  id: string
  title: string
  type: 'sleep' | 'breathing' | 'social' | 'movement' | 'reflect'
  durationMin: number
  rationale: string
  sourceIds: string[]
  contentStatus: 'demo wording' | 'sourced' | 'staff-edited (demo)'
}
