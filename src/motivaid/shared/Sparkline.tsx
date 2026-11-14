// Plain SVG sparkline. Values may contain undefined (no reading that day). Baseline mean is a dashed line.
export function Sparkline({ values, mean, label, width = 140, height = 36 }: { values: (number | undefined)[]; mean?: number; label: string; width?: number; height?: number }) {
  const nums = values.filter((v): v is number => v !== undefined)
  if (nums.length < 2) return <p className="text-xs text-dim">Not enough readings for a trend yet.</p>
  const all = mean !== undefined ? [...nums, mean] : nums
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const span = hi - lo || 1
  const x = (i: number) => 2 + (i / Math.max(values.length - 1, 1)) * (width - 4)
  const y = (v: number) => height - 3 - ((v - lo) / span) * (height - 6)
  let d = ''
  let pen = false
  values.forEach((v, i) => {
    if (v === undefined) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `
    pen = true
  })
  const last = values.length - 1
  const lastV = values[last]
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label} className="max-w-full">
      {mean !== undefined && <line x1="0" x2={width} y1={y(mean)} y2={y(mean)} stroke="#6B6B74" strokeWidth="1" strokeDasharray="3 3" />}
      <path d={d} fill="none" stroke="#EDEDEF" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {lastV !== undefined && <circle cx={x(last)} cy={y(lastV)} r="2.5" fill="#EDEDEF" />}
    </svg>
  )
}
