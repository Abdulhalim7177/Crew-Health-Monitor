// Every numeric threshold in one place. All are demo parameters: no source gives these cut-offs.

export const BASELINE_PARAMS = {
  /** A personal baseline needs at least this many usable check-ins. */
  minCheckIns: 3,
  /** The baseline uses the first N mission days, so a slow drift later does not move it. */
  windowDays: 7,
  demoParameter: true,
} as const

export const STATUS_PARAMS = {
  /** "Watch" when the value is at least this many personal SDs worse than baseline. */
  watchSd: 1,
  /** "Act" when at least this many SDs worse. */
  actSd: 2,
  demoParameter: true,
} as const
