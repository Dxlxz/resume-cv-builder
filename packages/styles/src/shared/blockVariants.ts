import type { LayoutProfile } from '@rb/themes/types'

/**
 * Geometry shared by the PDF and HTML block renderers.
 *
 * The page plan is built by measuring the HTML blocks in a hidden DOM, so any
 * variant that changes how wide text wraps has to produce the same numbers on
 * both sides. Keeping the arithmetic here — rather than duplicating it in two
 * renderers — is what stops the plan drifting from the export.
 *
 * Every value these helpers use comes from `LayoutProfile`, so a theme,
 * template or preset can tune it. Nothing here is a hardcoded constant.
 */

/** Total width the date gutter takes from the text column, rail mode only. */
export function railOffsetPt(layout: LayoutProfile): number {
  return layout.entryStyle === 'rail' ? layout.railWidthPt + layout.railGutterPt : 0
}

/**
 * Bullets are emitted as their own blocks when an entry is fragmented across a
 * page break, so in rail mode they need the same indent as the entry body or
 * they would sit under the dates.
 */
export function bulletIndentPt(layout: LayoutProfile): number {
  return railOffsetPt(layout)
}

/** Width of one skills column as a percentage string, grid mode only. */
export function skillColumnWidth(layout: LayoutProfile): string {
  const columns = Math.max(1, Math.round(layout.skillGridColumns))
  return `${100 / columns}%`
}

/** Right padding inside a skills-grid cell. */
export function skillGridGutterPt(layout: LayoutProfile): number {
  return layout.bulletGapPt * layout.skillGridGutterScale
}

/** Vertical gap between skills-grid rows. */
export function skillGridRowGapPt(layout: LayoutProfile): number {
  return layout.bulletGapPt * layout.skillGridRowGapScale
}

/** Padding inside a full-width header band. */
export function headerBandPaddingPt(layout: LayoutProfile): number {
  return layout.headerRulePaddingPt * layout.headerBandPaddingScale
}

/** Height of the accent bar beside a section title. */
export function accentBarHeightPt(layout: LayoutProfile, sectionSizePt: number): number {
  return sectionSizePt * layout.accentBarHeightRatio
}

export function usesRail(layout: LayoutProfile): boolean {
  return layout.entryStyle === 'rail'
}

export function usesSkillGrid(layout: LayoutProfile): boolean {
  return layout.skillsStyle === 'grid'
}

export function usesAccentBar(layout: LayoutProfile): boolean {
  return layout.sectionTitleDecoration === 'accent-bar'
}

export function usesInlineRule(layout: LayoutProfile): boolean {
  return layout.sectionTitleDecoration === 'rule-inline'
}
