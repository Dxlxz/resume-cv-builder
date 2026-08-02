import type { ResumeDocument } from '@rb/core/types/document'
import type { LintIssue } from '@rb/validators/types'

export function runPaginateRules(
  document: ResumeDocument,
  previewPageCount: number,
): LintIssue[] {
  const issues: LintIssue[] = []

  if (document.meta.documentType === 'resume' && previewPageCount > 2) {
    issues.push({
      level: 'info',
      code: 'PAGINATION_OVERFLOW_RISK',
      message: `Preview shows ${previewPageCount} pages — corporate resumes are usually 1–2 pages.`,
    })
  }

  if (document.meta.documentType === 'resume' && previewPageCount > 3) {
    issues.push({
      level: 'warning',
      code: 'PAGINATION_OVERFLOW_RISK',
      message: `Resume spans ${previewPageCount} pages — strongly consider trimming content.`,
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
      level: 'warning',
      code: 'PAGINATION_PAGE_COUNT_DRIFT',
      message: `Preview shows ${previewPages} pages but PDF has ${pdfPages}. Layout may differ slightly between browser and PDF engine.`,
    }
  }
  return null
}
