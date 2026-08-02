import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { isSectionEmpty } from '@rb/core/schema/shared'

export function getVisibleSections(
  document: ResumeDocument,
  options: { hideEmpty?: boolean } = {},
): SectionId[] {
  const { hideEmpty = true } = options
  const hidden = new Set(document.meta.hiddenSections)

  return document.meta.sectionOrder.filter((sectionId) => {
    if (sectionId === 'contact') return true
    if (hidden.has(sectionId)) return false
    if (hideEmpty && isSectionEmpty(document, sectionId)) return false
    return true
  })
}
