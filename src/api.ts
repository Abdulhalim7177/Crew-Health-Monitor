// Talks to the backend. The session token lives in this browser tab only, so two tabs
// can be signed in as two different people (useful for the demo: crew in one, Earth in the other).

import type { User } from './data/users'
import { localCall } from './localBackend'
import type { CheckIns } from './model'
import type { CrewReading } from './triage'

export interface ActivityEvent {
  id: number
  at: string
  kind: string
  detail: string
}
export interface Message {
  id: number
  from_user: string
  from_name: string
  side: 'ship' | 'earth'
  kind: 'message' | 'report' | 'emergency'
  body: string
  day: number
  delay_min: number
  sent_at: number
  deliver_at: number
  delivered: boolean
}
export interface Note {
  id: number
  crew_id: string
  day: number
  text: string
  at: string
}
export interface ServerState {
  user: User
  now: number
  messages: Message[]
  checkIns: CheckIns
  events: ActivityEvent[]
  notes: Note[]
  tasksDone: { day: number; key: string }[]
  emergencies: { id: number; scenario: string; patient: string; day: number; started_at: string }[]
}

const TOKEN_KEY = 'chm.token'
export const getToken = () => {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
const setToken = (t: string | null) => {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // Storage blocked: the session lasts until the tab reloads.
  }
}

export type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: string }

// MotivAid keeps all data in this browser (no server, see the brief). Calls are answered by localBackend.
/** Always true: there is no server. Kept so existing screens can show the local-data notice. */
export const isDemoMode = () => Promise.resolve(true)

async function call<T>(method: string, path: string, body?: unknown): Promise<Result<T>> {
  const r = localCall(method, path, body as Record<string, unknown> | undefined, getToken())
  return r.status === 200 ? { ok: true, data: r.data as T } : { ok: false, status: r.status, error: (r.data as { error: string }).error }
}

export const fetchUsers = () => call<{ users: User[] }>('GET', '/api/users')
export async function login(userId: string, pin: string) {
  const r = await call<{ token: string; user: User }>('POST', '/api/login', { userId, pin })
  if (r.ok) setToken(r.data.token)
  return r
}
export async function logout() {
  await call('POST', '/api/logout')
  setToken(null)
}
export const fetchState = () => call<ServerState>('GET', '/api/state')
export const putCheckIn = (crewId: string, day: number, reading: CrewReading) => call<ServerState>('PUT', `/api/checkins/${crewId}/${day}`, reading)
export const clearCheckIns = () => call<ServerState>('DELETE', '/api/checkins')
export const postNote = (day: number, text: string) => call<ServerState>('POST', '/api/notes', { day, text })
export const postTask = (day: number, key: string, done: boolean) => call<ServerState>('POST', '/api/tasks', { day, key, done })
export const postMessage = (day: number, body: string, kind: 'message' | 'report', mission: string) => call<ServerState>('POST', '/api/messages', { day, body, kind, mission })
export const postEmergency = (record: { scenario: string; patient: string; day: number; mission: string; startedAt: string; steps: { title: string; atSeconds: number }[] }) =>
  call<ServerState>('POST', '/api/emergencies', record)
