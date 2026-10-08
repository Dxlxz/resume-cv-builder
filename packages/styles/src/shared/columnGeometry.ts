import type { LayoutProfile } from '@rb/themes/types'

/** Width of the hairline between the columns, when the template draws one. */
export const SIDEBAR_RULE_PT = 0.75

export interface ColumnGeometry {
  /** Outer width of the rail, padding included (the rail View is this wide). */
  railOuterPt: number
  railPaddingLeftPt: number
  railPaddingRightPt: number
  mainPaddingLeftPt: number
  mainPaddingRightPt: number
  /** Width the rail's text really gets. */
  sideContentPt: number
  /** Width the main column's text really gets. */
  mainContentPt: number
}

/**
 * One source of truth for two-column widths. The planner measures blocks at `sideContentPt` and `mainContentPt`; the
 * renderer draws the Views with the paddings below. In the PDF engine a View's width includes its padding, so measuring
 * at the nominal rail width (as an earlier version did) wrapped text differently on the page than in the plan.
 */
export function columnGeometry(layout: LayoutProfile, pageWidthPt: number): ColumnGeometry {
  const margin = layout.pageMarginPt
  const gutter = layout.sidebarGutterPt
  const rule = layout.sidebarRule ? SIDEBAR_RULE_PT : 0
  const railOuterPt = layout.sidebarWidthPt
  const right = layout.sidebarSide === 'right'
  // The hairline sits inside the rail's inner padding, so the text keeps the full gutter minus the line itself.
  const railInner = gutter - rule
  return {
    railOuterPt,
    railPaddingLeftPt: right ? railInner : margin,
    railPaddingRightPt: right ? margin : railInner,
    mainPaddingLeftPt: right ? margin : gutter,
    mainPaddingRightPt: right ? gutter : margin,
    sideContentPt: railOuterPt - margin - gutter,
    mainContentPt: pageWidthPt - railOuterPt - margin - gutter,
  }
}
