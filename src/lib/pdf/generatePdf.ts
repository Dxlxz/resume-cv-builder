import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import { runWithLayoutPlan } from '@rb/layout/pdfLayoutContext'
import type { LayoutPlanResult } from '@rb/layout/types'

export async function generatePdf(
  document: ResumeDocument,
  presetLabels: Partial<Record<SectionId, string>> = {},
): Promise<Blob> {
  const plan = await computeLayoutPlan(document, presetLabels)
  return generatePdfWithPlan(document, plan)
}

export async function generatePdfWithPlan(
  document: ResumeDocument,
  plan: LayoutPlanResult,
): Promise<Blob> {
  const { renderDocumentToPdf } = await import('@rb/render/renderDocumentToPdf')
  return runWithLayoutPlan(plan, () => renderDocumentToPdf(document))
}
