import type { ResumeDocument } from '@rb/core/types/document'
import type { LayoutPlanResult } from '@rb/layout/types'
import type { LintIssue } from '@rb/validators/types'

const PAGE_1_FILL_WARN = 0.55
const MEASURE_WIDTH_DRIFT_PT = 3

export function runLayoutRules(
  document: ResumeDocument,
  layoutPlan: LayoutPlanResult | null,
): LintIssue[] {
  void document
  if (!layoutPlan) return []

  const issues: LintIssue[] = []
  const page1Fill = layoutPlan.plan.fillRatio[0] ?? 0

  if (layoutPlan.plan.pageCount > 1 && page1Fill < PAGE_1_FILL_WARN) {
    issues.push({
      level: 'warning',
      code: 'LAYOUT_PAGE_1_DEAD_ZONE',
      message: `Page 1 uses only ${Math.round(page1Fill * 100)}% of vertical space — content may break awkwardly.`,
    })
  }

  for (const block of layoutPlan.measured.blocks) {
    const drift = Math.abs(block.bbox.width - layoutPlan.plan.contentWidthPt)
    if (drift > MEASURE_WIDTH_DRIFT_PT) {
      issues.push({
        level: 'warning',
        code: 'LAYOUT_MEASURE_WIDTH_DRIFT',
        message: `Block "${block.id}" width drifted ${drift.toFixed(1)}pt from content column.`,
      })
      break
    }
  }

  const orphanBreak = layoutPlan.plan.breaks.find((b) => b.reason.startsWith('orphan title'))
  if (orphanBreak) {
    issues.push({
      level: 'info',
      code: 'LAYOUT_ORPHAN_TITLE',
      message: `Pagination moved a section title to avoid an orphan: ${orphanBreak.reason}.`,
    })
  }

  return issues
}
