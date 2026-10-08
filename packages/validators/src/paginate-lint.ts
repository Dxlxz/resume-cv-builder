import type { ResumeDocument } from '@rb/core/types/document'
import type { LintIssue } from '@rb/validators/types'

/** Length is a recruiter preference, not a parsing rule (F-007 research), so it is a tip, and resumes only. */
export function runPaginateRules(
  document: ResumeDocument,
  previewPageCount: number,
): LintIssue[] {
  const issues: LintIssue[] = []

  if (document.meta.documentType === 'resume' && previewPageCount > 2) {
    issues.push({
      level: 'info',
      code: 'PAGINATION_OVERFLOW_RISK',
      message: `Preview shows ${previewPageCount} pages. Most corporate resumes are 1–2 pages; a third is fine when the experience needs it.`,
    })
  }

  return issues
}

export function paginateDriftIssue(
  previewPages: number,
  pdfPages: number,
): LintIssue | null {
  if (Math.abs(previewPages - pdfPages) > 1) {
    return {
      level: 'info',
      code: 'PAGINATION_PAGE_COUNT_DRIFT',
      message: `Preview shows ${previewPages} pages but PDF has ${pdfPages}. Layout may differ slightly between browser and PDF engine.`,
    }
  }
  return null
}
