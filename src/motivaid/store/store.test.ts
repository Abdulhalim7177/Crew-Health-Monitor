import { describe, expect, it } from 'vitest'
import { SEEDED_THROUGH } from '../data/scenario'
import { STORAGE_KEY, createStore, memoryStorage, type Channel } from './store'

/** Two fake tabs joined by one channel, sharing one localStorage. */
function twoTabs() {
  const storage = memoryStorage()
  const a: Channel = { onmessage: null, postMessage: (m) => b.onmessage?.({ data: m }) }
  const b: Channel = { onmessage: null, postMessage: (m) => a.onmessage?.({ data: m }) }
  const tab1 = createStore({ storage, session: memoryStorage(), channel: a })
  const tab2 = createStore({ storage, session: memoryStorage(), channel: b })
  return { storage, tab1, tab2 }
}

const input = { crewId: 'C1', sleepHours: 7, sleepQuality: 4, fatigue: 2, mood: 4, stress: 2, socialContact: 4, confinementStrain: 2, restingHr: 58, redFlags: [] as string[] }

describe('store', () => {
  it('seeds 4 crew, all four roles, and days 1..20', () => {
    const { tab1 } = twoTabs()
    const s = tab1.get()
    expect(s.crew).toHaveLength(4)
    expect(new Set(s.users.map((u) => u.role))).toEqual(new Set(['crew', 'crewMedicalOfficer', 'flightSurgeon', 'missionAdmin']))
    expect(s.checkIns).toHaveLength(4 * SEEDED_THROUGH)
    expect(s.missionDay).toBe(SEEDED_THROUGH + 1)
  })

  it('demo login checks the PIN and keeps the session per tab', () => {
    const { tab1, tab2 } = twoTabs()
    expect(tab1.login('C1', '0000').ok).toBe(false)
    expect(tab1.login('C1', '2026').ok).toBe(true)
    expect(tab1.currentUser()?.id).toBe('C1')
    expect(tab2.currentUser()).toBeNull()
  })

  it('a check-in saved in one tab reaches the other tab and its subscribers', () => {
    const { tab1, tab2 } = twoTabs()
    tab1.login('C1', '2026')
    let seen = 0
    tab2.subscribe((s) => (seen = s.checkIns.filter((c) => c.source === 'user').length))
    const r = tab1.addCheckIn(input)
    expect(r.ok).toBe(true)
    expect(seen).toBe(1)
    expect(tab2.get().checkIns.find((c) => c.source === 'user')?.missionDay).toBe(SEEDED_THROUGH + 1)
  })

  it('replaces an earlier check-in from the same day', () => {
    const { tab1 } = twoTabs()
    tab1.login('C1', '2026')
    tab1.addCheckIn(input)
    tab1.addCheckIn({ ...input, stress: 4 })
    const today = tab1.get().checkIns.filter((c) => c.crewId === 'C1' && c.missionDay === tab1.get().missionDay)
    expect(today).toHaveLength(1)
    expect(today[0].stress).toBe(4)
  })

  it('rejects out-of-range values, signed-out users and other people (no-fire)', () => {
    const { tab1 } = twoTabs()
    expect(tab1.addCheckIn(input).ok).toBe(false)
    tab1.login('C3', '2026')
    expect(tab1.addCheckIn(input).ok).toBe(false)
    expect(tab1.addCheckIn({ ...input, crewId: 'C3', mood: 9 }).ok).toBe(false)
  })

  it('reseeds when the saved data is from another schema version, and reset restores the seed', () => {
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 0 }))
    const s = createStore({ storage, session: memoryStorage(), channel: null })
    expect(s.get().checkIns.length).toBe(4 * SEEDED_THROUGH)
    s.advanceDay()
    s.reset()
    expect(s.get().missionDay).toBe(SEEDED_THROUGH + 1)
  })
})
