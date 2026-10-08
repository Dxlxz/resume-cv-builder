import type { LintIssue } from '@rb/validators/types'

/**
 * What the ATS check reports (F-007). There is no 0–100 score: no ATS scores resumes on style, so a number built from
 * style rules overstated them. Status depends on errors (cannot export) and warnings (ATS risks) only; tips are
 * counted but never change the status.
 */
export type AtsStatus = 'blocked' | 'risks' | 'ready'

export interface CheckSummary {
  status: AtsStatus
  /** Short label for the badge and the panel. */
  label: string
  errors: number
  risks: number
  tips: number
}

const LABELS: Record<AtsStatus, string> = {
  blocked: 'Fix before export',
  risks: 'ATS risks to review',
  ready: 'ATS ready',
}

export function summarizeChecks(issues: LintIssue[]): CheckSummary {
  const errors = issues.filter((i) => i.level === 'error').length
  const risks = issues.filter((i) => i.level === 'warning').length
  const tips = issues.filter((i) => i.level === 'info').length
  const status: AtsStatus = errors > 0 ? 'blocked' : risks > 0 ? 'risks' : 'ready'
  return { status, label: LABELS[status], errors, risks, tips }
}
