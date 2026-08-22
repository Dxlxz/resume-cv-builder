import type { ThemeId } from '@rb/core/types/document'

export type BuiltinPdfFontFamily =
  | 'Helvetica'
  | 'Helvetica-Bold'
  | 'Helvetica-Oblique'
  | 'Times-Roman'
  | 'Times-Bold'
  | 'Times-Italic'

/** Built-in react-pdf fonts or custom families registered via Font.register. */
export type PdfFontFamily = BuiltinPdfFontFamily | 'Carlito' | 'Source Serif 4'

export interface TypographyScale {
  nameSize: number
  sectionSize: number
  subheadingSize: number
  bodySize: number
  metaSize: number
  lineHeight: number
  letterSpacingSection: number
}

export type SectionTitleDecoration = 'rule' | 'spacing-only' | 'accent-bar' | 'rule-inline'

/** Document header: stacked text, or a full-bleed colour band. */
export type HeaderStyle = 'stacked' | 'band'

/**
 * How a dated entry lays out. `stacked` puts dates on the title row;
 * `rail` moves them into a fixed left gutter, which narrows the text measure
 * and gives the page a vertical axis. Both stay a single reading column, so
 * neither affects pagination.
 */
export type EntryStyle = 'stacked' | 'rail'

/** Skills as packed lines, or a multi-column grid of individual items. */
export type SkillsStyle = 'lines' | 'grid'

export interface LayoutProfile {
  pageMarginPt: number
  sectionGapPt: number
  sectionTitleGapPt: number
  headerGapPt: number
  nameToMetaPt: number
  metaLineGapPt: number
  metaLineHeight: number
  headerRulePaddingPt: number
  ruleToFirstSectionPt: number
  itemSubtitleGapPt: number
  itemGapPt: number
  bulletIndentPt: number
  bulletGapPt: number
  skillGroupGapPt: number
  paragraphGapPt: number
  headerBorderWidthPt: number
  sectionTitleTransform: 'uppercase' | 'none' | 'capitalize'
  sectionTitleDecoration: SectionTitleDecoration
  headerStyle: HeaderStyle
  entryStyle: EntryStyle
  skillsStyle: SkillsStyle
  /** Width of the date gutter when entryStyle is 'rail'. */
  railWidthPt: number
  /** Gap between the rail and the text column. */
  railGutterPt: number
  /** Columns used when skillsStyle is 'grid'. */
  skillGridColumns: number

  // -- Decoration geometry. Previously hardcoded in the renderers, which
  // meant two of the four sectionTitleDecoration variants could not be
  // tuned by a theme, template or preset.
  /** Width of the bar beside an 'accent-bar' section title. */
  accentBarWidthPt: number
  /** Gap between that bar and the title text. */
  accentBarGapPt: number
  /** Bar height as a multiple of sectionSize. */
  accentBarHeightRatio: number
  /** Gap between a 'rule-inline' title and its trailing hairline. */
  inlineRuleGapPt: number
  /** Band padding as a multiple of headerRulePaddingPt, headerStyle 'band'. */
  headerBandPaddingScale: number
  /** Gap between the two columns of a title/date row. */
  rowGapPt: number
  /** Right padding of a skills-grid cell, as a multiple of bulletGapPt. */
  skillGridGutterScale: number
  /** Row gap in a skills grid, as a multiple of bulletGapPt. */
  skillGridRowGapScale: number
  headerAlign: 'left' | 'center'
  headerBorderBottom: boolean
  /** Character budget per packed skill line (content width at body size). */
  skillLineMaxChars: number
  /**
   * Render at most this many bullets per experience/project item.
   * Unset = no cap. spacing-lint warns when content is hidden by the cap.
   */
  maxBulletsPerItem?: number
}

export interface FontStacks {
  previewBody: string
  previewHeading: string
  pdfBody: PdfFontFamily
  pdfHeading: PdfFontFamily
  pdfBold: PdfFontFamily
  pdfItalic: PdfFontFamily
}

/** @deprecated Use typography + fonts — kept for backwards compatibility */
export interface LegacyPdfTokens {
  bodyFont: 'Helvetica' | 'Times-Roman'
  headingFont: 'Helvetica-Bold' | 'Times-Bold'
  bodySize: number
  headingSize: number
  nameSize: number
}

export interface ThemeTokens {
  id: ThemeId
  name: string
  atsSafe: boolean
  colors: {
    text: string
    textMuted: string
    accent: string
    border: string
    paper: string
  }
  typography: TypographyScale
  layout: LayoutProfile
  fonts: FontStacks
  /** @deprecated — use typography + fonts */
  pdf: LegacyPdfTokens
}

export const DEFAULT_TYPOGRAPHY: TypographyScale = {
  nameSize: 18,
  sectionSize: 12,
  subheadingSize: 11,
  bodySize: 10.5,
  metaSize: 9,
  lineHeight: 1.4,
  letterSpacingSection: 0.5,
}

export const DEFAULT_LAYOUT: LayoutProfile = {
  pageMarginPt: 48,
  sectionGapPt: 16,
  sectionTitleGapPt: 8,
  headerGapPt: 12,
  nameToMetaPt: 10,
  metaLineGapPt: 7,
  metaLineHeight: 1.45,
  headerRulePaddingPt: 8,
  ruleToFirstSectionPt: 16,
  itemSubtitleGapPt: 3,
  itemGapPt: 10,
  bulletIndentPt: 12,
  bulletGapPt: 4,
  skillGroupGapPt: 6,
  paragraphGapPt: 6,
  headerBorderWidthPt: 1,
  sectionTitleTransform: 'uppercase',
  sectionTitleDecoration: 'spacing-only',
  headerAlign: 'left',
  headerBorderBottom: true,
  skillLineMaxChars: 100,
  headerStyle: 'stacked',
  entryStyle: 'stacked',
  skillsStyle: 'lines',
  railWidthPt: 66,
  railGutterPt: 12,
  skillGridColumns: 3,
  accentBarWidthPt: 2.5,
  accentBarGapPt: 7,
  accentBarHeightRatio: 0.95,
  inlineRuleGapPt: 10,
  headerBandPaddingScale: 2,
  rowGapPt: 8,
  skillGridGutterScale: 2,
  skillGridRowGapScale: 0.5,
}

export function buildLegacyPdf(theme: Pick<ThemeTokens, 'typography' | 'fonts'>): LegacyPdfTokens {
  const isSerif =
    theme.fonts.pdfBody === 'Times-Roman' || theme.fonts.pdfBody === 'Source Serif 4'
  return {
    bodyFont: isSerif ? 'Times-Roman' : 'Helvetica',
    headingFont: isSerif ? 'Times-Bold' : 'Helvetica-Bold',
    bodySize: theme.typography.bodySize,
    headingSize: theme.typography.sectionSize,
    nameSize: theme.typography.nameSize,
  }
}
