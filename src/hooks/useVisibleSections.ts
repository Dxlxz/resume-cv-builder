import { useMemo } from 'react'
import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { getVisibleSections } from '@rb/core/selectors/getVisibleSections'

export { getVisibleSections }

export function useVisibleSections(
  document: ResumeDocument,
  hideEmpty = true,
): SectionId[] {
  return useMemo(
    () => getVisibleSections(document, { hideEmpty }),
    [document, hideEmpty],
  )
}
