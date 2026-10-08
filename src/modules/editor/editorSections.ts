import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { isSectionFilled } from './sectionStatus'

/**
 * The sections the editor lists for a document. A Letter section only belongs to a cover letter; a resume or CV
 * shows it only if it already holds letter content, so nothing a user wrote is ever hidden. The document itself is
 * not changed: the order saved in the draft still contains every section.
 */
export function editorSections(document: ResumeDocument): SectionId[] {
  const showLetter = document.meta.documentType === 'cover-letter' || isSectionFilled(document, 'letter')
  return document.meta.sectionOrder.filter((id) => id !== 'letter' || showLetter)
}

/**
 * Applies a new order of the listed sections to the full saved order, leaving the sections the editor does not list
 * where they were.
 */
export function mergeSectionOrder(fullOrder: SectionId[], nextListed: SectionId[]): SectionId[] {
  const listed = new Set(nextListed)
  const queue = [...nextListed]
  return fullOrder.map((id) => (listed.has(id) ? queue.shift()! : id))
}
