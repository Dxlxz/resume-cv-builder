import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { computeLayoutPlan } from '@rb/pipeline/computeLayoutPlan'
import { runWithLayoutPlan } from '@rb/layout/pdfLayoutContext'
import type { LayoutPlanResult } from '@rb/layout/types'
import { getPreset } from '@rb/presets/registry'
import { pdfEngine } from './pdfEngine'

type Labels = Partial<Record<SectionId, string>>

export async function generatePdf(document: ResumeDocument, presetLabels: Labels = {}): Promise<Blob> {
  const typst = await renderWithTypst(document, presetLabels)
  if (typst) return typst
  return renderWithReactPdf(document, await computeLayoutPlan(document, presetLabels))
}

/** The preview path: it has already computed the plan (the lints read it). Labels default to the preset's. */
export async function generatePdfWithPlan(
  document: ResumeDocument,
  plan: LayoutPlanResult,
  presetLabels: Labels = getPreset(document.meta.presetId).labels,
): Promise<Blob> {
  const typst = await renderWithTypst(document, presetLabels)
  if (typst) return typst
  return renderWithReactPdf(document, plan)
}

async function renderWithReactPdf(document: ResumeDocument, plan: LayoutPlanResult): Promise<Blob> {
  const { renderDocumentToPdf } = await import('@rb/pipeline/renderDocumentToPdf')
  return runWithLayoutPlan(plan, () => renderDocumentToPdf(document))
}

/**
 * Typst is the default engine (F-006). Returns null, so react-pdf renders, when this browser opted out, the template
 * is not covered, or Typst failed (for example the WASM could not be fetched): the user still gets a PDF. Each call
 * tries Typst once. The Typst code and its WASM are fetched on first use only.
 */
async function renderWithTypst(document: ResumeDocument, presetLabels: Labels): Promise<Blob | null> {
  if (pdfEngine() !== 'typst') return null
  try {
    const { supportsTypst, renderDocumentWithTypst } = await import('@rb/typst/renderWithTypst')
    if (!supportsTypst(document.meta.templateId)) return null
    return await renderDocumentWithTypst(document, presetLabels)
  } catch (err) {
    console.warn('Typst render failed; falling back to react-pdf.', err)
    return null
  }
}
