import type { BlockPdfHints, LayoutBlock, MeasuredLayout, PagePlan } from '@rb/layout/types'
import type { LayoutProfile, TypographyScale } from '@rb/themes/types'
import { keepWithNextPeekPt, minPresenceForSection } from '@rb/templates/shared/spacingHelpers'

export function buildBlockPdfHints(
  blocks: LayoutBlock[],
  measured: MeasuredLayout,
  plan: PagePlan,
  typography: TypographyScale,
  layout: LayoutProfile,
): Record<string, BlockPdfHints> {
  const hints: Record<string, BlockPdfHints> = {}
  const minPresence = minPresenceForSection(typography, layout)
  const peek = keepWithNextPeekPt(typography, layout)
  const measuredById = new Map(measured.blocks.map((b) => [b.id, b]))
  const indexById = new Map(blocks.map((b, i) => [b.id, i]))

  const firstBlockOfPage = new Map<number, string>()
  for (const slice of plan.slices) {
    if (!firstBlockOfPage.has(slice.pageIndex)) {
      firstBlockOfPage.set(slice.pageIndex, slice.blockId)
    }
  }

  for (const slice of plan.slices) {
    const index = indexById.get(slice.blockId)
    if (index === undefined) continue
    const block = blocks[index]

    // keepWithNext blocks must bring a peek of the next block onto their page.
    // Pairing with the FULL next block (old behavior) forced early breaks and
    // half-empty pages whenever a long item followed a section title.
    let minPresenceAhead: number | undefined
    if (block.breakPolicy === 'keepWithNext') {
      const next = blocks[index + 1]
      const selfHeight = measuredById.get(block.id)?.bbox.height ?? 0
      const nextPeek = next
        ? Math.min(measuredById.get(next.id)?.bbox.height ?? 0, peek) +
          next.spacingBeforePt
        : 0
      const paired = selfHeight + block.spacingAfterPt + nextPeek
      const floor = block.type === 'sectionTitle' ? minPresence : 0
      minPresenceAhead = Math.min(plan.contentHeightPt * 0.5, Math.max(floor, paired))
    }

    // Whole-kept items taller than half a page must be allowed to wrap, or
    // react-pdf would push an unbreakable box and overflow the page.
    const oversizedKeep =
      block.breakPolicy === 'keep' &&
      (measuredById.get(block.id)?.bbox.height ?? 0) > plan.contentHeightPt * 0.55

    hints[block.id] = {
      wrap: block.breakPolicy === 'keep' && !oversizedKeep ? false : undefined,
      minPresenceAhead,
      breakBefore:
        slice.pageIndex > 0 && firstBlockOfPage.get(slice.pageIndex) === slice.blockId
          ? true
          : undefined,
    }
  }

  return hints
}
