import type { Severity } from '../data/types'

export const SEV_LABEL: Record<Severity, string> = { ok: 'Usual', watch: 'Watch', act: 'Act', escalate: 'Escalate' }
export const SEV_MARK: Record<Severity, string> = { ok: '✓', watch: '!', act: '!!', escalate: '!!!' }
export const SEV_CLASS: Record<Severity, string> = {
  ok: 'border-line text-muted',
  watch: 'border-transparent bg-check-bg text-check',
  act: 'border-transparent bg-urgent-bg text-urgent',
  escalate: 'border-urgent bg-urgent-bg text-urgent',
}
export const SEV_COLOR: Record<Severity, string> = { ok: '#a1a1aa', watch: '#f5a524', act: '#ff7a7f', escalate: '#ff7a7f' }
