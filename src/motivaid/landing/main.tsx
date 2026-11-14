// Landing page: pick the crew app or the staff console.
// Sprint 0 shell (Claude Code). Sprint 1 adds role-based login routing via src/motivaid/store.
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '../../index.css'
import { Logo } from '../../ui'
import { registerSW } from '../registerSW'
import { DEMO_PIN, HOME_APP, ROLE_LABEL, USERS } from '../data/accounts'
import { getStore } from '../store/store'
import { login as crewLogin } from '../../api'

registerSW()

const base = import.meta.env.BASE_URL

function Landing() {
  const [selected, setSelected] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [resetDone, setResetDone] = useState(false)

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    const user = USERS.find((u) => u.id === selected)
    if (!user) return setError('Pick an account first.')
    const r = getStore().login(user.id, pin)
    if (!r.ok) return setError(r.error)
    if (HOME_APP[user.role] === 'crew') {
      const c = await crewLogin(user.id, pin)
      if (!c.ok) return setError(c.error)
      location.href = `${base}crew.html`
    } else {
      location.href = `${base}console.html`
    }
  }
  const reset = () => {
    getStore().reset()
    try {
      localStorage.removeItem('chm.local.v1')
    } catch {
      // storage blocked: nothing to clear
    }
    setResetDone(true)
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[720px] flex-col px-4 py-10 sm:px-6">
      <div className="flex items-center gap-3">
        <Logo />
        <h1 className="text-2xl font-semibold tracking-tight">MotivAid</h1>
      </div>
      <p className="mt-2 text-muted">Intelligent monitoring. Early detection. Personalised care.</p>
      <p className="mt-6 rounded-xl border border-line-strong px-4 py-3 text-sm">Every person and every reading here is simulated. Demo login, not secure.</p>

      <form onSubmit={signIn} className="mt-6 rounded-2xl border border-line bg-panel p-5" aria-labelledby="signin-h">
        <h2 id="signin-h" className="font-semibold">Sign in (demo)</h2>
        <p className="mt-1 text-sm text-muted">Demo PIN for every account: {DEMO_PIN}. Demo login, not secure.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Demo accounts">
          {USERS.map((u) => (
            <button type="button" key={u.id} role="radio" aria-checked={selected === u.id} onClick={() => { setSelected(u.id); setError(null) }} className={`press min-h-11 rounded-[10px] border px-3 py-2 text-left ${selected === u.id ? 'border-ink bg-raised' : 'border-line-strong'}`}>
              <span className="block text-sm font-medium">{u.name}{selected === u.id ? ' (selected)' : ''}</span>
              <span className="block text-xs text-muted">{u.title} · {ROLE_LABEL[u.role]}</span>
            </button>
          ))}
        </div>
        <label htmlFor="pin" className="mt-4 block text-sm text-muted">PIN</label>
        <input id="pin" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} className="mt-1 block min-h-11 w-full max-w-[200px] rounded-[10px] border border-line-strong bg-raised px-3 text-base" />
        {error && <p role="alert" className="mt-3 rounded-xl bg-urgent-bg px-3 py-2 text-sm text-urgent">Error: {error}</p>}
        <button type="submit" className="press mt-4 min-h-11 rounded-[10px] bg-ink px-5 text-sm font-semibold text-ground hover:bg-white">Sign in</button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <a href={`${base}crew.html`} className="press block rounded-2xl border border-line bg-panel p-5 hover:border-line-strong focus-visible:outline-2">
          <h2 className="font-semibold">Crew app</h2>
          <p className="mt-1 text-sm text-muted">For astronauts. Daily check-in, trends against your own baseline, explained findings, your plan. Installable on a phone, works offline.</p>
        </a>
        <a href={`${base}console.html`} className="press block rounded-2xl border border-line bg-panel p-5 hover:border-line-strong focus-visible:outline-2">
          <h2 className="font-semibold">Staff console</h2>
          <p className="mt-1 text-sm text-muted">For the crew medical officer, flight surgeon and mission admin. Crew overview, alert triage, roster, rules.</p>
        </a>
      </div>

      <div className="mt-6 text-sm">
        <button type="button" onClick={reset} className="press min-h-11 rounded-[10px] border border-line-strong px-3 text-muted hover:bg-raised">Reset demo data</button>
        <span role="status" className="ml-3 text-muted">{resetDone ? 'Demo data reset.' : ''}</span>
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
