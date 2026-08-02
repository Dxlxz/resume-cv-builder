import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import type { LayoutDocument } from '@rb/layout/types'
import { compileStandardLayout } from '@rb/layout/compile/compileStandardLayout'

export function compileLayout(
  document: ResumeDocument,
  presetLabels: Partial<Record<SectionId, string>> = {},
): LayoutDocument {
  return compileStandardLayout(document, presetLabels)
}
