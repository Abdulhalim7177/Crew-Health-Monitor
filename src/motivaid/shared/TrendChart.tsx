// Larger SVG line chart: readings by mission day, baseline mean (dashed) and a +/-1 SD band.
export interface TrendPoint {
  day: number
  value: number
}

export function TrendChart({ points, mean, sd, unit, label }: { points: TrendPoint[]; mean?: number; sd?: number; unit: string; label: string }) {
  const W = 640
  const H = 220
  const pad = { l: 40, r: 12, t: 12, b: 28 }
  if (points.length < 2) return <p className="text-sm text-muted">Not enough readings for a trend yet.</p>
  const vals = points.map((p) => p.value)
  const band = mean !== undefined && sd !== undefined ? [mean - sd, mean + sd] : []
  const lo = Math.min(...vals, ...band, ...(mean !== undefined ? [mean] : []))
  const hi = Math.max(...vals, ...band, ...(mean !== undefined ? [mean] : []))
  const span = hi - lo || 1
  const d0 = points[0].day
  const d1 = points[points.length - 1].day
  const x = (day: number) => pad.l + ((day - d0) / Math.max(d1 - d0, 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - lo) / span) * (H - pad.t - pad.b)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.day).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')
  const ticks = [lo, (lo + hi) / 2, hi]
  const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1))
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="h-auto w-full">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#2A2A30" strokeWidth="1" />
          <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#8B8B94">{fmt(t)}</text>
        </g>
      ))}
      {band.length === 2 && <rect x={pad.l} width={W - pad.l - pad.r} y={y(band[1])} height={Math.max(y(band[0]) - y(band[1]), 1)} fill="#8B8B94" opacity="0.16" />}
      {mean !== undefined && <line x1={pad.l} x2={W - pad.r} y1={y(mean)} y2={y(mean)} stroke="#8B8B94" strokeDasharray="4 4" />}
      <path d={path} fill="none" stroke="#EDEDEF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p) => (
        <circle key={p.day} cx={x(p.day)} cy={y(p.value)} r="2.5" fill="#EDEDEF" />
      ))}
      <text x={pad.l} y={H - 8} fontSize="11" fill="#8B8B94">Day {d0}</text>
      <text x={W - pad.r} y={H - 8} textAnchor="end" fontSize="11" fill="#8B8B94">Day {d1}</text>
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#8B8B94">{unit}</text>
    </svg>
  )
}
