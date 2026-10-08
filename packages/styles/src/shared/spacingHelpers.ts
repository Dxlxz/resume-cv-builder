import type { LayoutProfile, TypographyScale } from '@rb/themes/types'
import type { PdfStyle } from '@rb/styles/shared/types'

export function minPresenceForSection(
  typography: TypographyScale,
  layout: LayoutProfile,
): number {
  const bodyLine = typography.bodySize * typography.lineHeight
  const titleLine = typography.sectionSize * typography.lineHeight
  // Keep section title with at least one content block (typical role / entry header).
  return Math.round(
    layout.sectionTitleGapPt + titleLine + bodyLine * 3 + layout.itemSubtitleGapPt,
  )
}

/**
 * How much of the next block a keepWithNext block must pull onto its page:
 * roughly two body lines. Pairing with the FULL next block forces early page
 * breaks and large bottom gaps whenever a long item follows a section title.
 */
export function keepWithNextPeekPt(
  typography: TypographyScale,
  layout: LayoutProfile,
): number {
  const bodyLine = typography.bodySize * typography.lineHeight
  return Math.round(bodyLine * 2 + layout.itemSubtitleGapPt)
}

/**
 * Small items move as one block; larger items are fragmented at compile time
 * (header + bullet blocks) so the planner can break between lines instead of
 * dragging a whole item to the next page and leaving a gap behind.
 */
export function shouldKeepItemTogether(
  bulletCount: number,
  typography: TypographyScale,
  layout: LayoutProfile,
  contentHeightPt: number,
): boolean {
  const line = typography.bodySize * typography.lineHeight
  const headerLines = 2
  const estimated = (headerLines + bulletCount) * line + layout.itemGapPt
  return bulletCount <= 3 && estimated <= contentHeightPt * 0.25
}

export function createSectionTitleStylePicker(sectionTitle: PdfStyle, sectionTitleFirst: PdfStyle) {
  let isFirst = true
  return () => {
    if (isFirst) {
      isFirst = false
      return sectionTitleFirst
    }
    return sectionTitle
  }
}
