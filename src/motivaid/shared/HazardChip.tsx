import { HAZARD_LABEL } from '../data/sources'

export function HazardChip({ hazard }: { hazard: string }) {
  return <span className="inline-flex h-6 items-center rounded-md border border-line px-2 text-[11px] text-muted">Hazard: {HAZARD_LABEL[hazard] ?? hazard}</span>
}
