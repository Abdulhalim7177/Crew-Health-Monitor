// Staff console entry. Sprint 0 shell written by Claude Code; owner: Kilo Code (builds it in Sprint 3).
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '../../index.css'
import { Logo } from '../../ui'
import { registerSW } from '../registerSW'

registerSW()

function Console() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-bar px-6 py-3">
        <Logo />
        <p className="font-semibold tracking-tight">MotivAid · Staff console</p>
        <span className="ml-auto rounded-md border border-line-strong px-2 py-0.5 text-xs">Simulated</span>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-8">
        <h1 className="text-xl font-semibold tracking-tight">Crew overview</h1>
        <p className="mt-2 text-sm text-muted">Coming in Sprint 3: crew overview grid, alert triage queue, roster and roles, Earth-link messaging, rule editing.</p>
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
