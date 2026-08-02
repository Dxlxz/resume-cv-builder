import type { LintIssue } from '@rb/validators/types'

export type ScoreBand = 'excellent' | 'good' | 'fair' | 'poor'

export interface ResumeScore {
  score: number
  band: ScoreBand
  bandLabel: string
  errors: number
  warnings: number
  infos: number
}

export const SCORE_ERROR_PENALTY = 14
export const SCORE_WARNING_PENALTY = 7
export const SCORE_INFO_PENALTY = 2

const BANDS: { min: number; band: ScoreBand; label: string }[] = [
  { min: 90, band: 'excellent', label: 'Ready to export' },
  { min: 75, band: 'good', label: 'Needs polish' },
  { min: 60, band: 'fair', label: 'Fix key issues' },
  { min: 0, band: 'poor', label: 'Fix errors first' },
]

export function scoreDocument(issues: LintIssue[]): ResumeScore {
  const errors = issues.filter((i) => i.level === 'error').length
  const warnings = issues.filter((i) => i.level === 'warning').length
  const infos = issues.filter((i) => i.level === 'info').length

  const raw =
    100 -
    errors * SCORE_ERROR_PENALTY -
    warnings * SCORE_WARNING_PENALTY -
    infos * SCORE_INFO_PENALTY
  const score = Math.max(0, Math.min(100, raw))
  const entry = BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]

  return {
    score,
    band: entry.band,
    bandLabel: entry.label,
    errors,
    warnings,
    infos,
  }
}
