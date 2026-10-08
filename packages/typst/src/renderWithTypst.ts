import { TEMPLATE_IDS, type ResumeDocument, type SectionId, type TemplateId } from '@rb/core/types/document'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { resolveDocumentStyles } from '@rb/styles'
import { layoutToTypst, type TypstDocumentMeta } from '@rb/typst/toTypst'

/** Templates the Typst engine covers: every template is a set of layout knobs, and toTypst mirrors each knob. */
export const TYPST_TRIAL_TEMPLATES: readonly TemplateId[] = TEMPLATE_IDS

export function supportsTypst(templateId: TemplateId): boolean {
  return TYPST_TRIAL_TEMPLATES.includes(templateId)
}

const DOC_LABEL: Record<ResumeDocument['meta']['documentType'], string> = {
  resume: 'Resume',
  cv: 'CV',
  'cover-letter': 'Cover letter',
}

export function typstMeta(document: ResumeDocument): TypstDocumentMeta {
  const name = document.contact.fullName.trim() || 'Untitled'
  const headline = document.contact.headline?.trim()
  return {
    title: `${name} — ${DOC_LABEL[document.meta.documentType]}`,
    author: name,
    keywords: headline ? [headline] : [],
    pageSize: document.meta.pageSize,
    lang: document.meta.locale.split('-')[0] ?? 'en',
  }
}

/** The document as Typst source, from the same layout IR the react-pdf engine draws. */
export function documentToTypst(
  document: ResumeDocument,
  presetLabels: Partial<Record<SectionId, string>> = {},
): string {
  return layoutToTypst(compileLayout(document, presetLabels), resolveDocumentStyles(document), typstMeta(document))
}

/** Renders with Typst. The compiler is loaded on first use only. */
export async function renderDocumentWithTypst(
  document: ResumeDocument,
  presetLabels: Partial<Record<SectionId, string>> = {},
): Promise<Blob> {
  const { compileTypstToPdf } = await import('@rb/typst/compileTypst')
  const bytes = await compileTypstToPdf(documentToTypst(document, presetLabels))
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}
