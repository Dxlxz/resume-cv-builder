import { useMemo } from 'react'
import type { SectionId } from '@rb/core/types/document'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'

export { getSectionLabel }

export function useSectionLabel(
  sectionId: SectionId,
  presetLabels: Partial<Record<SectionId, string>> = {},
): string {
  return useMemo(
    () => getSectionLabel(sectionId, presetLabels),
    [sectionId, presetLabels],
  )
}
