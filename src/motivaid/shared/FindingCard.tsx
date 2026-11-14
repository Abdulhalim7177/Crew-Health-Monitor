import type { Ruleset } from '../data/rules'
import type { Finding } from '../data/types'
import { HazardChip } from './HazardChip'
import { SEV_CLASS, SEV_LABEL, SEV_MARK } from './severity'
import { demoBadge } from './StatusBadge'
import { WhyPanel } from './WhyPanel'

const DOM: Record<string, string> = { HEART: 'Heart', SLEEP: 'Sleep', MIND: 'Mind' }

export function FindingCard({ finding, ruleset, open, selected, onToggle }: { finding: Finding; ruleset: Ruleset; open: boolean; selected: boolean; onToggle: () => void }) {
  const redFlag = finding.id === 'RED-FLAG'
  const panelId = `why-${finding.id}`
  return (
    <li className={`rounded-2xl border p-4 ${redFlag ? 'border-urgent bg-urgent-bg' : selected ? 'border-line-strong bg-panel' : 'border-line bg-panel'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs font-medium ${SEV_CLASS[finding.severity]}`}>
          <span aria-hidden="true">{SEV_MARK[finding.severity]}</span>{SEV_LABEL[finding.severity]}
        </span>
        <HazardChip hazard={finding.hazard} />
        {finding.demoParameter && demoBadge}
      </div>
      <h3 className="mt-2 font-semibold">{finding.title}</h3>
      {redFlag && <p className="mt-1 font-semibold text-urgent">Tell your crew medical officer now</p>}
      <p className="mt-1 text-xs text-muted">Domains: {finding.domains.map((d) => DOM[d]).join(', ')} · Simulated</p>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle} className="press mt-3 min-h-11 rounded-[10px] border border-line-strong bg-raised px-4 text-sm font-medium hover:border-ink">
        {open ? 'Hide why this fired' : 'Why this fired'}
      </button>
      {open && <div id={panelId}><WhyPanel finding={finding} ruleset={ruleset} /></div>}
    </li>
  )
}
