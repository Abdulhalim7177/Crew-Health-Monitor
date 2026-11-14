// DEMO ACCOUNTS. Made-up people, one shared demo PIN, shown on the login screen. Demo login, not secure.
// Ids match the original app's accounts (C1-C4, FS) so both parts of the crew app agree on who is signed in.

import type { CrewMember, User } from './types'

export const DEMO_PIN = '2026'
export const MISSION_ID = 'mars-transit'

export const CREW: CrewMember[] = [
  { id: 'C1', name: 'E. Vance', missionRole: 'Commander', missionId: MISSION_ID, active: true },
  { id: 'C2', name: 'M. Chen', missionRole: 'Crew medical officer', missionId: MISSION_ID, active: true },
  { id: 'C3', name: 'S. Jenkins', missionRole: 'Science specialist', missionId: MISSION_ID, active: true },
  { id: 'C4', name: 'A. Rivera', missionRole: 'Flight engineer', missionId: MISSION_ID, active: true },
]

export const USERS: User[] = [
  { id: 'C1', name: 'E. Vance', role: 'crew', title: 'Commander', crewId: 'C1', demoPin: DEMO_PIN },
  { id: 'C2', name: 'M. Chen', role: 'crewMedicalOfficer', title: 'Crew medical officer', crewId: 'C2', demoPin: DEMO_PIN },
  { id: 'C3', name: 'S. Jenkins', role: 'crew', title: 'Science specialist', crewId: 'C3', demoPin: DEMO_PIN },
  { id: 'C4', name: 'A. Rivera', role: 'crew', title: 'Flight engineer', crewId: 'C4', demoPin: DEMO_PIN },
  { id: 'FS', name: 'Dr. K. Osei', role: 'flightSurgeon', title: 'Flight surgeon, Earth', demoPin: DEMO_PIN },
  { id: 'MA', name: 'J. Park', role: 'missionAdmin', title: 'Mission admin, Earth', demoPin: DEMO_PIN },
]

export const ROLE_LABEL: Record<User['role'], string> = {
  crew: 'Crew',
  crewMedicalOfficer: 'Crew medical officer',
  flightSurgeon: 'Flight surgeon',
  missionAdmin: 'Mission admin',
}

/** Which app a role opens after login. The medical officer is crew, but triages from the console. */
export const HOME_APP: Record<User['role'], 'crew' | 'console'> = {
  crew: 'crew',
  crewMedicalOfficer: 'console',
  flightSurgeon: 'console',
  missionAdmin: 'console',
}
