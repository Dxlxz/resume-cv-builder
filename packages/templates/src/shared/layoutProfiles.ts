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
