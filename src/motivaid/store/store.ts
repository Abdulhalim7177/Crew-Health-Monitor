// Shared local store for the crew app and the staff console.
// All data stays in this browser (localStorage). BroadcastChannel tells other open tabs to reload,
// so a crew check-in shows up live in a console tab. Not real sync: same browser and profile only.
// The session (who is signed in) is per tab (sessionStorage), so two tabs can be two people.

import { CREW, USERS } from '../data/accounts'
import { INDICATORS } from '../data/indicators'
import { SEEDED_THROUGH, seedCheckIns } from '../data/scenario'
import type { Alert, CheckIn, CrewMember, Message, RuleOverride, User } from '../data/types'

export const SCHEMA_VERSION = 1
export const STORAGE_KEY = `motivaid.store.v${SCHEMA_VERSION}`
const SESSION_KEY = 'motivaid.session'
const CHANNEL = 'motivaid'

export interface AuditEntry {
  at: string
  byId: string
  text: string
}

export interface StoreState {
  version: typeof SCHEMA_VERSION
  /** Today's mission day for the demo. */
  missionDay: number
  users: User[]
  crew: CrewMember[]
  checkIns: CheckIn[]
  alerts: Alert[]
  messages: Message[]
  ruleOverrides: RuleOverride[]
  audit: AuditEntry[]
}

export interface KeyValue {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
export interface Channel {
  postMessage(msg: unknown): void
  onmessage: ((e: { data: unknown }) => void) | null
  close?(): void
}

export function seedState(): StoreState {
  return {
    version: SCHEMA_VERSION,
    missionDay: SEEDED_THROUGH + 1,
    users: USERS.map((u) => ({ ...u })),
    crew: CREW.map((c) => ({ ...c })),
    checkIns: seedCheckIns(),
    alerts: [],
    messages: [],
    ruleOverrides: [],
    audit: [],
  }
}

export function memoryStorage(): KeyValue {
  const m = new Map<string, string>()
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }
}

/** Check a submitted check-in. Returns an error message, or null when it is fine. */
export function validateCheckIn(c: CheckIn): string | null {
  for (const d of INDICATORS) {
    const v = c[d.id]
    if (v === undefined || v === null) {
      if (d.optional) continue
      return `${d.label} is missing.`
    }
    if (typeof v !== 'number' || !Number.isFinite(v) || v < d.min || v > d.max) return `${d.label} must be between ${d.min} and ${d.max} ${d.unit}.`
  }
  if (!Array.isArray(c.redFlags)) return 'Red flags must be a list.'
  return null
}

export interface StoreDeps {
  storage: KeyValue
  session: KeyValue
  channel: Channel | null
  now?: () => Date
}

export function createStore(deps: StoreDeps) {
  const now = deps.now ?? (() => new Date())
  const listeners = new Set<(s: StoreState) => void>()

  const read = (): StoreState => {
    try {
      const raw = deps.storage.getItem(STORAGE_KEY)
      if (raw) {
        const s = JSON.parse(raw) as StoreState
        if (s && s.version === SCHEMA_VERSION) return s
      }
    } catch {
      // Corrupt or blocked storage: fall through to a fresh seed.
    }
    const s = seedState()
    write(s)
    return s
  }
  const write = (s: StoreState) => {
    try {
      deps.storage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      // Storage full or blocked: keep working in memory for this tab.
    }
  }

  let state = read()
  const emit = () => listeners.forEach((l) => l(state))

  if (deps.channel) {
    deps.channel.onmessage = () => {
      state = read()
      emit()
    }
  }

  /** Apply a change, save it, and tell this tab and the other tabs. */
  const update = (change: (draft: StoreState) => void) => {
    const draft = structuredClone(state)
    change(draft)
    state = draft
    write(state)
    emit()
    deps.channel?.postMessage({ type: 'changed', at: now().toISOString() })
    return state
  }

  const currentUser = (): User | null => {
    const id = deps.session.getItem(SESSION_KEY)
    return (id && state.users.find((u) => u.id === id)) || null
  }

  return {
    get: () => state,
    subscribe(listener: (s: StoreState) => void) {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    },
    /** Pick up changes another tab saved (used by the storage-event fallback). */
    reload() {
      state = read()
      emit()
    },
    reset() {
      state = seedState()
      write(state)
      emit()
      deps.channel?.postMessage({ type: 'reset' })
    },

    currentUser,
    login(userId: string, pin: string): { ok: true; user: User } | { ok: false; error: string } {
      const user = state.users.find((u) => u.id === userId)
      if (!user) return { ok: false, error: 'Unknown account.' }
      if (pin !== user.demoPin) return { ok: false, error: 'Wrong PIN.' }
      deps.session.setItem(SESSION_KEY, user.id)
      emit()
      return { ok: true, user }
    },
    logout() {
      deps.session.removeItem(SESSION_KEY)
      emit()
    },

    /** Save today's check-in for a crew member (replaces an earlier one from the same day). */
    addCheckIn(input: Omit<CheckIn, 'missionDay' | 'date' | 'source'>): { ok: true; checkIn: CheckIn } | { ok: false; error: string } {
      const user = currentUser()
      if (!user) return { ok: false, error: 'Sign in first.' }
      if (user.crewId !== input.crewId && user.role !== 'crewMedicalOfficer') return { ok: false, error: 'You can only check in for yourself.' }
      const checkIn: CheckIn = { ...input, missionDay: state.missionDay, date: now().toISOString(), source: 'user' }
      const error = validateCheckIn(checkIn)
      if (error) return { ok: false, error }
      update((d) => {
        d.checkIns = d.checkIns.filter((c) => !(c.crewId === checkIn.crewId && c.missionDay === checkIn.missionDay))
        d.checkIns.push(checkIn)
        d.audit.push({ at: checkIn.date, byId: user.id, text: `Check-in saved for ${checkIn.crewId}, day ${checkIn.missionDay}` })
      })
      return { ok: true, checkIn }
    },

    /** Demo control: move to the next mission day. */
    advanceDay() {
      update((d) => {
        d.missionDay += 1
      })
    },

    update,
  }
}

export type Store = ReturnType<typeof createStore>

function browserDeps(): StoreDeps {
  const safe = (get: () => Storage): KeyValue => {
    try {
      const s = get()
      s.getItem('motivaid.probe')
      return s
    } catch {
      return memoryStorage()
    }
  }
  let channel: Channel | null = null
  try {
    channel = typeof BroadcastChannel === 'undefined' ? null : (new BroadcastChannel(CHANNEL) as unknown as Channel)
  } catch {
    channel = null
  }
  return { storage: safe(() => window.localStorage), session: safe(() => window.sessionStorage), channel }
}

let instance: Store | null = null
/** The store for this tab (created on first use). */
export function getStore(): Store {
  if (!instance) {
    instance = createStore(browserDeps())
    // Fallback for browsers without BroadcastChannel: the storage event fires in other tabs.
    if (typeof window !== 'undefined') window.addEventListener('storage', (e) => e.key === STORAGE_KEY && instance?.reload())
  }
  return instance
}
