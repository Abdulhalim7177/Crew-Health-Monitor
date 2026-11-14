// Staff console entry. Sprint 0 shell written by Claude Code; owner: Kilo Code (builds it in Sprint 3).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '../../index.css'
import { Logo } from '../../ui'
import { registerSW } from '../registerSW'
import { getStore } from '../store/store'
import { useCurrentUser, useStore } from '../store/useStore'

registerSW()

function LatestCheckIns() {
  const state = useStore()
  const rows = [...state.checkIns].sort((a, b) => b.missionDay - a.missionDay || b.date.localeCompare(a.date)).slice(0, 12)
  const name = (id: string) => state.crew.find((c) => c.id === id)?.name ?? id
  return (
    <section className="mt-8" aria-labelledby="latest-h">
      <h2 id="latest-h" className="font-semibold">Latest check-ins (live) · Simulated</h2>
      <p className="text-xs text-muted">Mission day now: {state.missionDay}. New check-ins from other tabs appear here without reload.</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-dim">
            <tr><th className="py-2 pr-3">Crew</th><th className="pr-3">Day</th><th className="pr-3">Time</th><th className="pr-3">Source</th><th className="pr-3">Stress (/5)</th><th>Sleep (h)</th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={`${c.crewId}-${c.missionDay}-${c.date}`} className="border-t border-line">
                <td className="py-2 pr-3">{name(c.crewId)}</td>
                <td className="pr-3">{c.missionDay}</td>
                <td className="pr-3">{new Date(c.date).toLocaleTimeString()}</td>
                <td className="pr-3">{c.source === 'user' ? 'User entered' : 'Simulated'}</td>
                <td className="pr-3">{c.stress}</td>
                <td>{c.sleepHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Console() {
  const user = useCurrentUser()
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-bar px-6 py-3">
        <Logo />
        <p className="font-semibold tracking-tight">MotivAid · Staff console</p>
        <span className="ml-auto rounded-md border border-line-strong px-2 py-0.5 text-xs">Simulated</span>
        {user ? (
          <span className="text-xs">
            {user.name} ({user.title}) ·{' '}
            <a className="underline" href={import.meta.env.BASE_URL} onClick={() => getStore().logout()}>Sign out</a>
          </span>
        ) : (
          <a className="text-xs underline" href={import.meta.env.BASE_URL}>Sign in</a>
        )}
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Crew overview</h1>
        <p className="mt-2 text-sm text-muted">Coming in Sprint 3: crew overview grid, alert triage queue, roster and roles, Earth-link messaging, rule editing.</p>
        <LatestCheckIns />
        <p className="mt-4 text-sm">
          <a className="underline" href={`${import.meta.env.BASE_URL}`}>Back to start</a>
        </p>
      </main>
      <footer className="border-t border-line px-6 py-3 text-center text-xs text-muted">
        Demo login, not secure. Simulated data. Not a medical device. Not clinically validated.
      </footer>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Console />
  </StrictMode>,
)
