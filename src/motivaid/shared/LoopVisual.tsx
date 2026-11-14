// HEART-SLEEP-MIND loop: three nodes and three links, lit by the selected finding's domains.
import type { Domain, Severity } from '../data/types'
import { SEV_COLOR } from './severity'

const NODES: Record<Domain, { x: number; y: number; label: string }> = {
  SLEEP: { x: 60, y: 140, label: 'Sleep' },
  MIND: { x: 240, y: 140, label: 'Mind' },
  HEART: { x: 150, y: 40, label: 'Heart' },
}
const LINKS: { a: Domain; b: Domain; d: string }[] = [
  { a: 'SLEEP', b: 'MIND', d: 'M 90 160 Q 150 190 210 160' },
  { a: 'MIND', b: 'HEART', d: 'M 225 112 Q 215 70 178 56' },
  { a: 'HEART', b: 'SLEEP', d: 'M 122 56 Q 85 70 75 112' },
]

export function loopCaption(domains: Domain[]): string {
  const s = new Set(domains)
  if (s.size >= 3) return 'Active loop: Sleep ↔ Mind ↔ Heart (Sleep, stress and heart rate moving together)'
  if (s.size === 2) {
    const names = (['SLEEP', 'MIND', 'HEART'] as Domain[]).filter((d) => s.has(d)).map((d) => NODES[d].label)
    return `Active loop: ${names.join(' ↔ ')}`
  }
  return 'No active loop'
}

export function LoopVisual({ domains, severity }: { domains: Domain[]; severity: Severity }) {
  const lit = new Set(domains)
  const caption = loopCaption(domains)
  const color = SEV_COLOR[severity]
  const linkOn = (a: Domain, b: Domain) => lit.size >= 2 && lit.has(a) && lit.has(b)
  return (
    <figure className="mx-auto max-w-[320px]">
      <style>{`@keyframes loop-pulse{0%,100%{opacity:1}50%{opacity:.45}}.loop-on{animation:loop-pulse 1.8s ease-in-out infinite}@media (prefers-reduced-motion:reduce){.loop-on{animation:none}}`}</style>
      <svg viewBox="0 0 300 210" role="img" aria-label={caption} className="w-full">
        <defs>
          <marker id="loop-arrow" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="context-stroke" /></marker>
        </defs>
        {LINKS.map((l) => {
          const on = linkOn(l.a, l.b)
          return <path key={l.d} d={l.d} fill="none" strokeWidth={on ? 3 : 1.5} stroke={on ? color : '#3a3a41'} markerStart="url(#loop-arrow)" markerEnd="url(#loop-arrow)" className={on ? 'loop-on' : undefined} />
        })}
        {(Object.keys(NODES) as Domain[]).map((d) => {
          const n = NODES[d]
          const on = lit.has(d) && lit.size >= 2
          return (
            <g key={d} className={on ? 'loop-on' : undefined}>
              <circle cx={n.x} cy={n.y} r={28} fill="#19191c" stroke={on ? color : '#3a3a41'} strokeWidth={on ? 3 : 1.5} />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="#ededef">{n.label}</text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-1 text-center text-sm text-muted">{caption}</figcaption>
    </figure>
  )
}
