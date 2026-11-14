import type { IndicatorStatus } from '../engine/baseline'

const LABEL: Record<IndicatorStatus, string> = { baseline: 'Building baseline', ok: 'Usual', watch: 'Watch', act: 'Act' }
const MARK: Record<IndicatorStatus, string> = { baseline: '…', ok: '✓', watch: '!', act: '!!' }
const STYLE: Record<IndicatorStatus, string> = {
  baseline: 'border-line text-muted',
  ok: 'border-line text-muted',
  watch: 'border-transparent bg-check-bg text-check',
  act: 'border-transparent bg-urgent-bg text-urgent',
}

/** Status is always text plus colour. */
export function StatusBadge({ status }: { status: IndicatorStatus }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-md border px-2 text-xs font-medium ${STYLE[status]}`}>
      <span aria-hidden="true">{MARK[status]}</span>
      {LABEL[status]}
    </span>
  )
}

export const demoBadge = (
  <span className="inline-flex h-6 items-center rounded-md border border-dashed border-line-strong px-2 text-[11px] text-muted">Demo parameter</span>
)
