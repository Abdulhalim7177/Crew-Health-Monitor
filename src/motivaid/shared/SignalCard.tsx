import { HAZARD_LABEL, SOURCES } from '../data/sources'
import type { IndicatorDef } from '../data/indicators'
import type { IndicatorStatus } from '../engine/baseline'
import { HazardChip } from './HazardChip'
import { Sparkline } from './Sparkline'
import { StatusBadge, demoBadge } from './StatusBadge'

export interface SignalCardProps {
  def: IndicatorDef
  value?: number
  status: IndicatorStatus
  deltaSd: number | null
  ageDays: number | null
  baselineMean?: number
  series: (number | undefined)[]
}

export const ageText = (d: number | null) => (d === null ? 'never measured' : d === 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`)

export function SignalCard({ def, value, status, deltaSd, ageDays, baselineMean, series }: SignalCardProps) {
  const reason =
    deltaSd === null
      ? 'Your personal baseline is still being built.'
      : deltaSd >= 0.05
        ? `${deltaSd.toFixed(1)} SD worse than your usual.`
        : deltaSd <= -0.05
          ? `${Math.abs(deltaSd).toFixed(1)} SD better than your usual.`
          : 'About the same as your usual.'
  return (
    <article className="rounded-2xl border border-line bg-panel p-4" aria-label={`${def.label}: ${status}`}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium">{def.label}</h4>
        <p className="font-mono text-lg tabular-nums">
          {value === undefined ? '–' : value}
          <span className="ml-1 text-xs text-muted">{def.unit}</span>
        </p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <StatusBadge status={status} />
        {demoBadge}
        <HazardChip hazard={def.hazard} />
      </div>
      <p className="mt-2 text-sm text-muted">{def.why}</p>
      <p className="mt-1 text-sm">{reason}</p>
      {(status === 'watch' || status === 'act') && <p className="mt-1 text-sm text-check">Next step: {def.nextStep}</p>}
      <div className="mt-3">
        <Sparkline values={series} mean={baselineMean} label={`${def.label}, last ${series.length} days. Dashed line is your baseline average.`} />
      </div>
      <p className="mt-2 text-xs text-dim">Data age: {ageText(ageDays)} · Simulated · {HAZARD_LABEL[def.hazard]}</p>
      <p className="mt-1 text-xs text-dim">
        Sources:{' '}
        {def.sourceIds.map((id, i) => (
          <span key={id}>
            {i > 0 && ', '}
            <a href={SOURCES[id].url} target="_blank" rel="noreferrer" className="underline" title={SOURCES[id].citation}>{SOURCES[id].citation.split('(')[0].trim()} {SOURCES[id].citation.match(/\((\d{4})\)/)?.[1] ?? ''}</a>
          </span>
        ))}
      </p>
    </article>
  )
}
