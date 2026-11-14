import { useEffect, useRef, useState } from 'react'
import { INDICATORS, RED_FLAGS, type IndicatorDef } from '../data/indicators'
import type { CheckIn, IndicatorId } from '../data/types'
import { getStore } from '../store/store'

const SCALE_HINT: Partial<Record<IndicatorId, [string, string]>> = {
  sleepQuality: ['Poor', 'Great'],
  fatigue: ['Fully alert', 'Exhausted'],
  mood: ['Low', 'Good'],
  stress: ['Calm', 'Very stressed'],
  socialContact: ['Isolated', 'Connected'],
  confinementStrain: ['Fine', 'Heavy'],
}
const PLAIN: Partial<Record<IndicatorId, string>> = {
  sleepHours: 'Hours slept last night',
  fatigue: 'How tired do you feel? (Samn-Perelli scale)',
  restingHr: 'Resting heart rate (beats per minute)',
  reactionMedianMs: 'Median reaction time (optional)',
  exerciseMin: 'Minutes of exercise (optional)',
}

type Values = Partial<Record<IndicatorId, string>>

export function CheckInForm({ crewId, crewName, prefill, onClose, onSaved }: { crewId: string; crewName: string; prefill?: CheckIn; onClose: () => void; onSaved: () => void }) {
  const [values, setValues] = useState<Values>(() => {
    const v: Values = {}
    for (const d of INDICATORS) {
      const p = prefill?.[d.id]
      v[d.id] = p === undefined ? '' : String(p)
    }
    return v
  })
  const [flags, setFlags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    dialog.current?.querySelector<HTMLElement>('button, input')?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (id: IndicatorId, v: string) => setValues((s) => ({ ...s, [id]: v }))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const input: Record<string, unknown> = { crewId, redFlags: flags }
    for (const d of INDICATORS) {
      const raw = values[d.id] ?? ''
      if (raw === '') {
        if (d.optional) continue
        setError(`${d.label} is missing.`)
        return
      }
      input[d.id] = Number(raw)
    }
    const r = getStore().addCheckIn(input as Parameters<ReturnType<typeof getStore>['addCheckIn']>[0])
    if (!r.ok) return setError(r.error)
    onSaved()
  }

  const field = (d: IndicatorDef) => {
    const label = PLAIN[d.id] ?? d.label
    const isScale = d.step === 1 && d.max - d.min <= 6
    if (isScale) {
      const hint = SCALE_HINT[d.id]
      const opts = Array.from({ length: d.max - d.min + 1 }, (_, i) => d.min + i)
      return (
        <fieldset key={d.id} className="mt-4">
          <legend className="text-sm font-medium">{label} <span className="text-dim">({d.min}-{d.max})</span></legend>
          <div className="mt-2 flex gap-1.5" role="radiogroup" aria-label={label}>
            {opts.map((o) => (
              <button
                type="button"
                key={o}
                role="radio"
                aria-checked={values[d.id] === String(o)}
                onClick={() => set(d.id, String(o))}
                className={`press min-h-11 flex-1 rounded-[10px] border text-sm font-medium ${values[d.id] === String(o) ? 'border-ink bg-ink text-ground' : 'border-line-strong bg-raised'}`}
              >
                {o}
              </button>
            ))}
          </div>
          {hint && (
            <p className="mt-1 flex justify-between text-xs text-dim">
              <span>{d.min} = {hint[0]}</span>
              <span>{d.max} = {hint[1]}</span>
            </p>
          )}
        </fieldset>
      )
    }
    return (
      <div key={d.id} className="mt-4">
        <label htmlFor={`ci-${d.id}`} className="text-sm font-medium">{label} <span className="text-dim">({d.unit}, {d.min}-{d.max})</span></label>
        <input
          id={`ci-${d.id}`}
          type="number"
          inputMode="decimal"
          min={d.min}
          max={d.max}
          step={d.step}
          value={values[d.id] ?? ''}
          onChange={(e) => set(d.id, e.target.value)}
          className="mt-1 block min-h-11 w-full rounded-[10px] border border-line-strong bg-raised px-3 text-base"
        />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 sm:items-center" onClick={onClose}>
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="ci-title" onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-t-2xl border border-line-strong bg-panel p-5 sm:rounded-2xl">
        <form onSubmit={submit}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="ci-title" className="text-lg font-semibold">Daily check-in</h2>
              <p className="text-xs text-muted">For {crewName} · Simulated · Prefilled from your last check-in</p>
            </div>
            <button type="button" onClick={onClose} className="press min-h-11 rounded-[10px] px-3 text-sm text-muted hover:bg-raised">Close</button>
          </div>
          {INDICATORS.map(field)}
          <fieldset className="mt-6">
            <legend className="text-sm font-medium">Any of these right now? (demo wording)</legend>
            {RED_FLAGS.map((f) => (
              <label key={f.id} className="mt-1 flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" className="h-5 w-5" checked={flags.includes(f.id)} onChange={(e) => setFlags((s) => (e.target.checked ? [...s, f.id] : s.filter((x) => x !== f.id)))} />
                {f.label}
              </label>
            ))}
          </fieldset>
          {error && <p role="alert" className="mt-4 rounded-xl bg-urgent-bg px-3 py-2 text-sm text-urgent">Error: {error}</p>}
          <button type="submit" className="press mt-5 min-h-12 w-full rounded-[10px] bg-ink text-sm font-semibold text-ground hover:bg-white">Save check-in</button>
        </form>
      </div>
    </div>
  )
}
