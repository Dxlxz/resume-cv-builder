import type { TemplateId } from '@rb/core/types/document'
import type { LayoutProfile, TypographyScale } from '@rb/themes/types'

export interface TemplateLayoutProfile {
  id: TemplateId
  layout?: Partial<LayoutProfile>
  typography?: Partial<TypographyScale>
}

export const TEMPLATE_LAYOUTS: Record<TemplateId, TemplateLayoutProfile> = {
  'ats-strict': {
    id: 'ats-strict',
    layout: {
      sectionTitleTransform: 'uppercase',
      headerAlign: 'left',
      sectionTitleDecoration: 'spacing-only',
      ruleToFirstSectionPt: 16,
      metaLineGapPt: 7,
      nameToMetaPt: 10,
      headerRulePaddingPt: 8,
      metaLineHeight: 1.45,
      itemSubtitleGapPt: 3,
    },
  },
  classic: {
    id: 'classic',
    typography: { nameSize: 20 },
    layout: {
      sectionGapPt: 18,
      headerGapPt: 14,
      headerAlign: 'center',
      headerBorderBottom: true,
      headerBorderWidthPt: 2,
      sectionTitleTransform: 'uppercase',
    },
  },
  /**
   * Dates move into a left gutter, so the text measure narrows and the page
   * gains a vertical axis. Still one reading column: a parser sees date then
   * entry, in order, and pagination is untouched.
   */
  'modern-rail': {
    id: 'modern-rail',
    layout: {
      entryStyle: 'rail',
      skillsStyle: 'grid',
      sectionTitleDecoration: 'accent-bar',
      sectionTitleTransform: 'uppercase',
      headerAlign: 'left',
      headerBorderBottom: true,
      sectionGapPt: 16,
      itemGapPt: 10,
      railWidthPt: 66,
      railGutterPt: 12,
      skillGridColumns: 3,
    },
  },
  /**
   * Full-bleed accent band behind the header; the body below stays a plain
   * single column, so ATS reading order is identical to ats-strict.
   */
  banner: {
    id: 'banner',
    layout: {
      headerStyle: 'band',
      sectionTitleDecoration: 'rule-inline',
      sectionTitleTransform: 'uppercase',
      headerAlign: 'left',
      headerBorderBottom: false,
      pageMarginPt: 52,
      sectionGapPt: 16,
      skillsStyle: 'grid',
      skillGridColumns: 2,
    },
  },
  /**
   * The only multi-column template. The sidebar carries short items only —
   * contact, links, skills — and every dated entry stays in the main column,
   * because reading order is what parsers actually care about. Evidence on
   * two-column parsing is split, so this is deliberately not marked ATS
   * optimised and ats-strict remains the portal choice.
   */
  sidebar: {
    id: 'sidebar',
    layout: {
      columns: 2,
      sidebarSections: ['contact', 'skills', 'certifications'],
      sidebarWidthPt: 168,
      sidebarGutterPt: 22,
      sidebarBackground: true,
      sectionTitleDecoration: 'rule',
      sectionTitleTransform: 'uppercase',
      headerAlign: 'left',
      headerBorderBottom: false,
      sectionGapPt: 14,
    },
  },
  /**
   * Harvard-style: centered name, hairline under each uppercase heading, serif
   * body (the template pins the serif theme), tight gaps. One reading column.
   */
  ivy: {
    id: 'ivy',
    typography: { nameSize: 22, sectionSize: 10.5, subheadingSize: 10.5, bodySize: 10.5, lineHeight: 1.36, letterSpacingSection: 1 },
    layout: {
      pageMarginPt: 46,
      sectionGapPt: 11,
      sectionTitleGapPt: 5,
      itemGapPt: 7,
      bulletGapPt: 2.5,
      headerGapPt: 8,
      nameToMetaPt: 5,
      metaLineGapPt: 3,
      ruleToFirstSectionPt: 10,
      headerAlign: 'center',
      headerBorderBottom: false,
      sectionTitleDecoration: 'rule',
      sectionTitleTransform: 'uppercase',
    },
  },
  /**
   * One-page density for early-career and technical resumes: small margins,
   * 10 pt body, an inline hairline after each heading. One reading column.
   */
  compact: {
    id: 'compact',
    typography: { nameSize: 21, sectionSize: 10.5, subheadingSize: 10, bodySize: 10, metaSize: 8.5, lineHeight: 1.28, letterSpacingSection: 0.8 },
    layout: {
      pageMarginPt: 34,
      sectionGapPt: 9,
      sectionTitleGapPt: 4,
      itemGapPt: 5,
      bulletGapPt: 1.5,
      bulletIndentPt: 10,
      paragraphGapPt: 3,
      headerGapPt: 6,
      nameToMetaPt: 4,
      metaLineGapPt: 3,
      ruleToFirstSectionPt: 8,
      itemSubtitleGapPt: 1.5,
      headerAlign: 'center',
      headerBorderBottom: false,
      sectionTitleDecoration: 'rule-inline',
      sectionTitleTransform: 'uppercase',
    },
  },
  /**
   * Main column first, then a narrow right rail for short items (skills,
   * certifications). Contact stays in the main header. The rail is written
   * after the main column, so extraction order is chronology first.
   */
  split: {
    id: 'split',
    layout: {
      columns: 2,
      sidebarSections: ['skills', 'certifications'],
      sidebarSide: 'right',
      sidebarRule: true,
      sidebarBackground: false,
      sidebarWidthPt: 206,
      sidebarGutterPt: 18,
      sectionTitleDecoration: 'accent-bar',
      sectionTitleTransform: 'uppercase',
      headerAlign: 'left',
      headerBorderBottom: false,
      sectionGapPt: 14,
    },
  },
  /**
   * Board-paper serif: left name over a full-width rule, dates in a left gutter, ruled uppercase headings. The
   * template pins the serif theme. One reading column, dates before each entry, as in modern-rail.
   */
  executive: {
    id: 'executive',
    typography: { nameSize: 24, sectionSize: 10.5, letterSpacingSection: 1.2, lineHeight: 1.38 },
    layout: {
      pageMarginPt: 48,
      sectionGapPt: 14,
      sectionTitleGapPt: 6,
      itemGapPt: 9,
      headerAlign: 'left',
      headerBorderBottom: true,
      headerBorderWidthPt: 1.5,
      entryStyle: 'rail',
      railWidthPt: 72,
      railGutterPt: 12,
      sectionTitleDecoration: 'rule',
      sectionTitleTransform: 'uppercase',
    },
  },
  /**
   * Centered header; each heading sits centered on a full-width tinted bar, so sections read as clear bands.
   * Skills in a three-column grid. One reading column; the tint is a fill, not an image or a table.
   */
  harbor: {
    id: 'harbor',
    typography: { nameSize: 24, sectionSize: 10.5, letterSpacingSection: 1.2 },
    layout: {
      pageMarginPt: 44,
      sectionGapPt: 13,
      sectionTitleGapPt: 7,
      itemGapPt: 9,
      headerAlign: 'center',
      headerBorderBottom: false,
      ruleToFirstSectionPt: 10,
      sectionTitleDecoration: 'shaded-bar',
      sectionTitleAlign: 'center',
      shadedBarPaddingPt: 2.5,
      sectionTitleTransform: 'uppercase',
      skillsStyle: 'grid',
      skillGridColumns: 3,
    },
  },
  /**
   * Full-height accent rail with paper-coloured text: name, contact, skills and certifications on the rail,
   * chronology in the main column. Same reading-order caveat as sidebar, so not marked ATS optimised.
   */
  slate: {
    id: 'slate',
    layout: {
      columns: 2,
      sidebarSections: ['contact', 'skills', 'certifications'],
      sidebarWidthPt: 184,
      sidebarGutterPt: 22,
      sidebarBackground: true,
      sidebarInverse: true,
      sectionTitleDecoration: 'rule',
      sectionTitleTransform: 'uppercase',
      headerAlign: 'left',
      headerBorderBottom: false,
      sectionGapPt: 14,
    },
  },
  /**
   * Quiet and airy: wide margins, a large left name, headings in plain capitalised weight with no rule. For
   * readers who want the content and nothing else. One reading column.
   */
  minimal: {
    id: 'minimal',
    typography: { nameSize: 26, sectionSize: 11.5, letterSpacingSection: 0.2 },
    layout: {
      pageMarginPt: 58,
      sectionGapPt: 20,
      sectionTitleGapPt: 7,
      itemGapPt: 11,
      headerAlign: 'left',
      headerBorderBottom: false,
      ruleToFirstSectionPt: 12,
      sectionTitleDecoration: 'spacing-only',
      sectionTitleTransform: 'capitalize',
    },
  },
  academic: {
    id: 'academic',
    typography: { bodySize: 11, lineHeight: 1.45, nameSize: 22 },
    layout: {
      pageMarginPt: 40,
      sectionGapPt: 12,
      itemGapPt: 8,
      sectionTitleTransform: 'none',
      headerAlign: 'left',
      headerBorderBottom: false,
    },
  },
}
