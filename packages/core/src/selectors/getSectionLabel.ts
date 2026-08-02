import type { SectionId } from '@rb/core/types/document'
import { SECTION_LABELS } from '@rb/core/types/document'

export function getSectionLabel(
  sectionId: SectionId,
  presetLabels: Partial<Record<SectionId, string>> = {},
): string {
  return presetLabels[sectionId] ?? SECTION_LABELS[sectionId]
}
