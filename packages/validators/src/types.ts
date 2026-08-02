import type { SectionId } from '@rb/core/types/document'

export type LintLevel = 'error' | 'warning' | 'info'

export interface LintIssue {
  level: LintLevel
  code: string
  message: string
  field?: string
  section?: SectionId
}
