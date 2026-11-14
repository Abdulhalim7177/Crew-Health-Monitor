// Landing page: pick the crew app or the staff console.
// Sprint 0 shell (Claude Code). Sprint 1 adds role-based login routing via src/motivaid/store.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '../../index.css'
import { Logo } from '../../ui'
import { registerSW } from '../registerSW'

registerSW()

const base = import.meta.env.BASE_URL

function Landing() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[720px] flex-col px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo />
        <h1 className="text-2xl font-semibold tracking-tight">MotivAid</h1>
      </div>
      <p className="mt-2 text-muted">Intelligent monitoring. Early detection. Personalised care.</p>
      <p className="mt-6 rounded-xl border border-line-strong px-4 py-3 text-sm">Every person and every reading here is simulated. Demo login, not secure.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a href={`${base}crew.html`} className="press block rounded-2xl border border-line bg-panel p-5 hover:border-line-strong focus-visible:outline-2">
          <h2 className="font-semibold">Crew app</h2>
          <p className="mt-1 text-sm text-muted">For astronauts. Daily check-in, trends against your own baseline, explained findings, your plan. Installable on a phone, works offline.</p>
        </a>
        <a href={`${base}console.html`} className="press block rounded-2xl border border-line bg-panel p-5 hover:border-line-strong focus-visible:outline-2">
          <h2 className="font-semibold">Staff console</h2>
          <p className="mt-1 text-sm text-muted">For the crew medical officer, flight surgeon and mission admin. Crew overview, alert triage, roster, rules.</p>
        </a>
      </div>

      <footer className="mt-auto pt-10 text-center text-xs text-muted">
        Simulated data. Not a medical device. Not clinically validated. · Built on Crew-Health-Monitor by AdityaK0804, used with permission.
      </footer>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)
