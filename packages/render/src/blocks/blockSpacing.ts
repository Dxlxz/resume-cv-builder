import type { LayoutBlock } from '@rb/layout/types'

export interface BlockWrapperMarginsPt {
  marginTop?: number
  marginBottom?: number
}

/**
 * Vertical rhythm from layout IR — single source for measure + PDF.
 *
 * Keys are omitted (not set to undefined) when spacing is zero: callers spread
 * this over style-sheet styles, and a present-but-undefined key would erase the
 * sheet value (e.g. section title marginBottom) instead of leaving it intact.
 */
export function blockWrapperStylePt(block: LayoutBlock): BlockWrapperMarginsPt {
  const style: BlockWrapperMarginsPt = {}
  if (block.spacingBeforePt > 0) style.marginTop = block.spacingBeforePt
  if (block.spacingAfterPt > 0) style.marginBottom = block.spacingAfterPt
  return style
}

export function blockWrapperStyleCss(block: LayoutBlock): {
  marginTop?: string
  marginBottom?: string
} {
  const pt = blockWrapperStylePt(block)
  const style: { marginTop?: string; marginBottom?: string } = {}
  if (pt.marginTop !== undefined) style.marginTop = `${pt.marginTop}pt`
  if (pt.marginBottom !== undefined) style.marginBottom = `${pt.marginBottom}pt`
  return style
}
