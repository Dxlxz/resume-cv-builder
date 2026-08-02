import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { measureLayout } from '@rb/layout/measure/measureLayout'
import { planPages } from '@rb/layout/plan/planPages'
import { buildBlockPdfHints } from '@rb/layout/adapt/reactPdfPlan'
import type { LayoutPlanResult } from '@rb/layout/types'
import { resolveDocumentStyles } from '@rb/styles'
import { keepWithNextPeekPt } from '@rb/templates/shared/spacingHelpers'

export async function computeLayoutPlan(
  document: ResumeDocument,
  presetLabels: Partial<Record<SectionId, string>> = {},
): Promise<LayoutPlanResult> {
  const layout = compileLayout(document, presetLabels)
  const styles = resolveDocumentStyles(document)
  const measured = await measureLayout(layout, styles)
  const plan = planPages(measured.blocks, layout.contentHeightPt, layout.contentWidthPt, {
    keepWithNextPeekPt: keepWithNextPeekPt(styles.typography, styles.layout),
  })
  const blockHints = buildBlockPdfHints(
    layout.blocks,
    measured,
    plan,
    styles.typography,
    styles.layout,
  )

  return { layout, measured, plan, blockHints }
}
