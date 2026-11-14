// MotivAid "Check-in" tab for the crew app: today panel, check-in form, signal cards, trends. All data simulated.
import { useEffect, useMemo, useState } from 'react'
import { CREW } from '../data/accounts'
import { INDICATORS, INDICATOR, RED_FLAGS } from '../data/indicators'
import type { Domain, IndicatorId } from '../data/types'
import { checkInStreak, computeBaseline, dataAgeDays, indicatorStatus } from '../engine/baseline'
import { baselinesFor, effectiveRuleset, evaluate } from '../engine/evaluate'
import { SCENARIO_DAYS, playbackHistory } from '../data/scenario'
import { FindingCard } from '../shared/FindingCard'
import { LoopVisual } from '../shared/LoopVisual'
import { SignalCard } from '../shared/SignalCard'
import { TrendChart } from '../shared/TrendChart'
import { DEMO_PIN } from '../data/accounts'
import { getStore } from '../store/store'
import { useCurrentUser, useStore } from '../store/useStore'
import { CheckInForm } from './CheckInForm'

const DOMAINS: { id: Domain; label: string }[] = [
  { id: 'SLEEP', label: 'Sleep' },
  { id: 'MIND', label: 'Mind' },
  { id: 'HEART', label: 'Heart' },
]

export default function MindToday({ userId }: { userId: string }) {
  const state = useStore()
  const storeUser = useCurrentUser()
  // Make the store session agree with the crew-app sign-in.
  useEffect(() => {
    if (!getStore().currentUser()) getStore().login(userId, DEMO_PIN)
  }, [userId])

  const me = storeUser ?? state.users.find((u) => u.id === userId) ?? null
  const isMedic = me?.role === 'crewMedicalOfficer'
  const [picked, setPicked] = useState<string | null>(null)
  const crewId = isMedic && picked ? picked : (me?.crewId ?? userId)
  const crewName = CREW.find((c) => c.id === crewId)?.name ?? crewId
  const [formOpen, setFormOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [trendId, setTrendId] = useState<IndicatorId>('stress')

  const storeToday = state.missionDay
  const [scrub, setScrub] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const today = Math.min(Math.max(scrub ?? storeToday, 1), SCENARIO_DAYS)
  const isToday = today === storeToday
  const future = today > storeToday
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setScrub((d) => {
      const n = (d ?? storeToday) + 1
      if (n >= SCENARIO_DAYS) setPlaying(false)
      return Math.min(n, SCENARIO_DAYS)
    }), 1200)
    return () => clearInterval(t)
  }, [playing, storeToday])
  const history = useMemo(() => playbackHistory(state.checkIns, crewId, today, storeToday), [state.checkIns, crewId, today, storeToday])
  const ruleset = useMemo(() => effectiveRuleset(state.ruleOverrides), [state.ruleOverrides])
  const findings = useMemo(() => evaluate(history, baselinesFor(history), ruleset), [history, ruleset])
  const hasStored = state.checkIns.some((c) => c.crewId === crewId && c.missionDay === today)
  const scripted = !hasStored && today >= storeToday
  const todays = hasStored ? history.find((c) => c.missionDay === today) : undefined
  const topFinding = findings.find((f) => f.id === openId) ?? findings[0]
  const latest = history[history.length - 1]
  const streak = checkInStreak(history, today)

  const signals = useMemo(
    () =>
      INDICATORS.map((def) => {
        const baseline = computeBaseline(history, def.id)
        const value = latest?.[def.id]
        const res = value === undefined ? { status: 'baseline' as const, deltaSd: null } : indicatorStatus(value, baseline)
        const last14 = Array.from({ length: 14 }, (_, i) => today - 13 + i)
        const series = last14.map((d) => history.find((c) => c.missionDay === d)?.[def.id])
        return { def, baseline, value, ...res, ageDays: dataAgeDays(history, def.id, today), series }
      }),
    [history, latest, today],
  )
  const flagged = signals.filter((s) => s.status === 'watch' || s.status === 'act').length
  const flagLabels = (todays?.redFlags ?? []).map((id) => RED_FLAGS.find((f) => f.id === id)?.label ?? id)

  const trendDef = INDICATOR[trendId]
  const trendBaseline = signals.find((s) => s.def.id === trendId)?.baseline
  const trendPoints = history.filter((c) => c[trendId] !== undefined).map((c) => ({ day: c.missionDay, value: c[trendId] as number }))
  const trendLabel = trendPoints.length
    ? `${trendDef.label} trend, days ${trendPoints[0].day} to ${trendPoints[trendPoints.length - 1].day}. Latest ${trendPoints[trendPoints.length - 1].value} ${trendDef.unit}.${trendBaseline ? ` Baseline average ${trendBaseline.mean.toFixed(1)} ${trendDef.unit}, plus or minus ${Math.max(trendBaseline.sd, trendDef.sdFloor).toFixed(1)}.` : ' Baseline still building.'} Simulated data.`
    : `${trendDef.label} trend: no readings.`

  if (!me) return <p className="p-6 text-muted">Signing in…</p>

  return (
    <main className="mx-auto max-w-[900px] px-4 py-5 sm:px-6">
      <section aria-labelledby="mt-today" className="rounded-2xl border border-line bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="mt-today" className="text-lg font-semibold">Mission day {today} · MotivAid scenario</h2>
          <span className="rounded-md border border-line-strong px-2 py-0.5 text-xs text-muted">{scripted ? 'Simulated · Scripted scenario' : 'Simulated'}</span>
        </div>
        {isMedic ? (
          <div className="mt-2">
            <label htmlFor="mt-crew" className="text-sm text-muted">Crew member: </label>
            <select id="mt-crew" value={crewId} onChange={(e) => setPicked(e.target.value)} className="min-h-11 rounded-[10px] border border-line-strong bg-raised px-3 text-sm">
              {CREW.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.missionRole})</option>)}
            </select>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted">{crewName}</p>
        )}
        {flagLabels.length > 0 && (
          <div role="alert" className="mt-4 rounded-xl border border-transparent bg-urgent-bg px-4 py-3 text-urgent">
            <p className="font-semibold">Red flag reported: tell your crew medical officer now</p>
            <p className="text-sm">{flagLabels.join(', ')} (demo wording)</p>
          </div>
        )}
        <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div><dt className="text-muted">Today</dt><dd className="font-medium">{todays ? 'Check-in done' : 'Not done yet'}</dd></div>
          <div><dt className="text-muted">Streak</dt><dd className="font-medium">{streak} {streak === 1 ? 'day' : 'days'}</dd></div>
          <div><dt className="text-muted">Watch or act</dt><dd className="font-medium">{flagged} of {signals.length}</dd></div>
        </dl>
        <div className="mt-4 rounded-xl border border-line bg-raised p-3">
          <label htmlFor="mt-scrub" className="text-sm font-medium">Scenario playback (mission day {today})</label>
          <input id="mt-scrub" type="range" min={1} max={SCENARIO_DAYS} step={1} value={today} onChange={(e) => { setPlaying(false); setScrub(Number(e.target.value)) }} className="day-range mt-1 w-full" aria-valuetext={`Mission day ${today} of ${SCENARIO_DAYS}`} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setPlaying(false); setScrub(Math.max(1, today - 1)) }} disabled={today <= 1} className="press min-h-11 rounded-[10px] border border-line-strong px-3 text-sm disabled:opacity-40">Previous day</button>
            <button type="button" onClick={() => { setPlaying(false); setScrub(Math.min(SCENARIO_DAYS, today + 1)) }} disabled={today >= SCENARIO_DAYS} className="press min-h-11 rounded-[10px] border border-line-strong px-3 text-sm disabled:opacity-40">Next day</button>
            <button type="button" onClick={() => setPlaying((p) => !p)} disabled={!playing && today >= SCENARIO_DAYS} aria-pressed={playing} className="press min-h-11 rounded-[10px] border border-line-strong px-3 text-sm disabled:opacity-40">{playing ? 'Pause' : 'Play'}</button>
            <button type="button" onClick={() => { setPlaying(false); setScrub(null) }} disabled={isToday} className="press min-h-11 rounded-[10px] border border-line-strong px-3 text-sm disabled:opacity-40">Back to today</button>
          </div>
          {future && <p role="status" className="mt-2 rounded-lg bg-check-bg px-3 py-2 text-sm text-check">Scripted scenario: these days have not happened yet. Nothing here is a real check-in.</p>}
          {!future && !isToday && <p className="mt-2 text-xs text-muted">Viewing an earlier day. Today is mission day {storeToday}.</p>}
        </div>
        <button disabled={!isToday} aria-describedby="mt-ci-note" onClick={() => { setSaved(false); setFormOpen(true) }} className="press mt-4 min-h-12 w-full rounded-[10px] bg-ink text-base font-semibold text-ground hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
          {todays ? 'Update daily check-in' : 'Daily check-in'}
        </button>
        {!isToday && <p id="mt-ci-note" className="mt-2 text-sm text-muted">Check-in works on today only (day {storeToday}). Use Back to today.</p>}
        <p role="status" className="mt-2 text-sm">{saved ? `Check-in saved for day ${today}. Cards and trends are updated.` : ''}</p>
        <p className="mt-1 text-xs text-dim">Statuses compare you with your own baseline. Thresholds are demo parameters.</p>
      </section>

      <section className="mt-6" aria-labelledby="mt-findings">
        <h3 id="mt-findings" className="text-xs font-medium tracking-[0.08em] text-dim uppercase">Patterns across Heart, Sleep and Mind · {scripted ? 'Scripted scenario' : 'Simulated'}</h3>
        {findings.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-line bg-panel p-4 text-sm">
            <p className="font-medium">No patterns found today</p>
            <p className="mt-1 text-muted">The engine checks HEART, SLEEP and MIND together, not one signal at a time.</p>
          </div>
        ) : (
          <ul className="mt-2 space-y-3">
            {findings.map((f) => <FindingCard key={f.id} finding={f} ruleset={ruleset} open={openId === f.id} selected={topFinding?.id === f.id} onToggle={() => setOpenId(openId === f.id ? null : f.id)} />)}
          </ul>
        )}
        <div className="mt-4 rounded-2xl border border-line bg-panel p-4">
          <LoopVisual domains={topFinding?.domains ?? []} severity={topFinding?.severity ?? 'ok'} />
        </div>
      </section>

      {DOMAINS.map((dom) => (
        <section key={dom.id} className="mt-6" aria-labelledby={`dom-${dom.id}`}>
          <h3 id={`dom-${dom.id}`} className="text-xs font-medium tracking-[0.08em] text-dim uppercase">{dom.label} · Simulated</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {signals.filter((s) => s.def.domain === dom.id).map((s) => (
              <SignalCard key={s.def.id} def={s.def} value={s.value} status={s.status} deltaSd={s.deltaSd} ageDays={s.ageDays} baselineMean={s.baseline?.mean} series={s.series} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-8 rounded-2xl border border-line bg-panel p-5" aria-labelledby="mt-trends">
        <h3 id="mt-trends" className="font-semibold">Trends · Simulated</h3>
        <label htmlFor="mt-trend-sel" className="mt-2 block text-sm text-muted">Indicator</label>
        <select id="mt-trend-sel" value={trendId} onChange={(e) => setTrendId(e.target.value as IndicatorId)} className="mt-1 min-h-11 rounded-[10px] border border-line-strong bg-raised px-3 text-sm">
          {INDICATORS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
        <div className="mt-3">
          <TrendChart points={trendPoints} mean={trendBaseline?.mean} sd={trendBaseline ? Math.max(trendBaseline.sd, trendDef.sdFloor) : undefined} unit={`${trendDef.unit} · dashed = baseline average, shaded = ±1 SD`} label={trendLabel} />
        </div>
      </section>

      {formOpen && (
        <CheckInForm
          key={`${crewId}-${today}`}
          crewId={crewId}
          crewName={crewName}
          prefill={todays ?? latest}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); setSaved(true) }}
        />
      )}
    </main>
  )
}
