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
