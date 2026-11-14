// Pre-approved citations only (Master Brief section 6). Add nothing here without verifying it first.

export interface Source {
  id: string
  citation: string
  url: string
}

export const SOURCES: Record<string, Source> = {
  engel1977: { id: 'engel1977', citation: 'Engel, G. L. (1977). The need for a new medical model. Science, 196(4286), 129–136.', url: 'https://doi.org/10.1126/science.847460' },
  barger2014: {
    id: 'barger2014',
    citation: 'Barger et al. (2014). Prevalence of sleep deficiency and use of hypnotic drugs in astronauts before, during, and after spaceflight: An observational study. The Lancet Neurology, 13(9), 904–912.',
    url: 'https://doi.org/10.1016/S1474-4422(14)70122-X',
  },
  basner2014: {
    id: 'basner2014',
    citation: 'Basner et al. (2014). Psychological and behavioral changes during confinement in a 520-day simulated interplanetary mission to Mars. PLOS ONE, 9(3), e93298.',
    url: 'https://doi.org/10.1371/journal.pone.0093298',
  },
  mendes2024: {
    id: 'mendes2024',
    citation: 'Mendes Zambetta et al. (2024). Cardiovascular adaptations associated with spaceflight and simulated weightlessness. Frontiers in Physiology.',
    url: 'https://doi.org/10.3389/fphys.2024.1438089',
  },
  'hrp-hazards': { id: 'hrp-hazards', citation: 'NASA Human Research Program, Five Hazards of Human Spaceflight.', url: 'https://www.nasa.gov/hrp/hazards/' },
  'hrp-risks': { id: 'hrp-risks', citation: 'NASA Human Research Program, Risks of Human Spaceflight.', url: 'https://www.nasa.gov/hrp/risks/' },
}

export const HAZARD_LABEL: Record<string, string> = {
  radiation: 'Radiation',
  isolation_confinement: 'Isolation and confinement',
  distance_from_earth: 'Distance from Earth',
  gravity_fields: 'Gravity fields',
  hostile_closed_environment: 'Hostile, closed environment',
}
