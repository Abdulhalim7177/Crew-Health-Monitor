// "Why this fired": explanation, evidence, parameters, next step and sources for one finding. Demo wording.
import { INDICATOR } from '../data/indicators'
import { RULES, type RuleId, type Ruleset } from '../data/rules'
import { SOURCES } from '../data/sources'
import type { Finding } from '../data/types'

export function WhyPanel({ finding, ruleset }: { finding: Finding; ruleset: Ruleset }) {
  const rule = RULES[finding.id as RuleId]
  const eff = ruleset[finding.id as RuleId] ?? {}
  return (
    <div className="mt-3 space-y-4 border-t border-line pt-3 text-sm">
      <div>
        <h4 className="text-xs font-medium tracking-[0.08em] text-dim uppercase">Why this fired</h4>
        <p className="mt-1">{finding.explanation}</p>
      </div>
      {finding.evidence.length > 0 && (
        <div>
          <h4 className="text-xs font-medium tracking-[0.08em] text-dim uppercase">Evidence (simulated)</h4>
          <ul className="mt-1 space-y-1">
            {finding.evidence.map((e) => {
              const def = INDICATOR[e.indicator as keyof typeof INDICATOR]
              return (
                <li key={e.indicator} className="rounded-lg bg-raised px-3 py-2">
                  <span className="font-medium">{def?.label ?? e.indicator}</span>: {e.value} {def?.unit}
                  <span className="text-muted"> · your baseline {e.baselineMean.toFixed(1)} {def?.unit} · {Math.abs(e.deltaSd).toFixed(1)} SD worse than usual</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {rule && (
        <div>
          <h4 className="text-xs font-medium tracking-[0.08em] text-dim uppercase">Fires when</h4>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-muted">
            {Object.entries(rule.params).map(([k, p]) => (
              <li key={k}>{p.label}: <span className="font-medium text-ink">{eff[k] ?? p.value}</span></li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h4 className="text-xs font-medium tracking-[0.08em] text-dim uppercase">Next step</h4>
        <p className="mt-1">{finding.nextStep}</p>
      </div>
      {finding.sourceIds.length > 0 && (
        <div>
          <h4 className="text-xs font-medium tracking-[0.08em] text-dim uppercase">Sources</h4>
          <ul className="mt-1 space-y-1 text-xs text-muted">
            {finding.sourceIds.map((id) => SOURCES[id] && (
              <li key={id}><a className="underline" href={SOURCES[id].url} target="_blank" rel="noreferrer">{SOURCES[id].citation}</a></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
