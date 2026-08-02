import type { CSSProperties } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { getTheme } from '@rb/themes/registry'
import type { LayoutProfile, ThemeTokens, TypographyScale } from '@rb/themes/types'
import { ptCss } from '@rb/styles/shared/pt'
import type { PageDimensions, ResolvedCssStyles, ResolvedPdfStyles, ResolvedStyles } from '@rb/styles/shared/types'
import { TEMPLATE_LAYOUTS } from '@rb/templates/shared/layoutProfiles'
import { getPreset } from '@rb/presets/registry'
import {
  pdfBoldStyle,
  pdfBodyFamily,
  pdfHeadingStyle,
  pdfItalicStyle,
} from '@rb/render/fonts/pdfFontStyle'

const PAGE_MM: Record<'a4' | 'letter', PageDimensions> = {
  a4: { widthMm: 210, heightMm: 297, size: 'a4' },
  letter: { widthMm: 215.9, heightMm: 279.4, size: 'letter' },
}

// Density resolution order: theme defaults ← template profile ← preset
// overrides. The preset wins so regional presets control final density.
// Preset density targets the 1–2 page RESUME norm only — CVs are
// comprehensive documents and keep theme/template density with no bullet cap.
function mergeTypography(theme: ThemeTokens, meta: ResumeDocument['meta']): TypographyScale {
  const tpl = TEMPLATE_LAYOUTS[meta.templateId]
  const preset = getPreset(meta.presetId)
  const presetTypography = meta.documentType === 'resume' ? preset.typography : undefined
  return { ...theme.typography, ...tpl.typography, ...presetTypography }
}

function mergeLayout(theme: ThemeTokens, meta: ResumeDocument['meta']): LayoutProfile {
  const tpl = TEMPLATE_LAYOUTS[meta.templateId]
  const preset = getPreset(meta.presetId)
  const presetLayout = meta.documentType === 'resume' ? preset.layout : undefined
  return { ...theme.layout, ...tpl.layout, ...presetLayout }
}

function textTransform(value: LayoutProfile['sectionTitleTransform']): CSSProperties['textTransform'] {
  return value === 'none' ? 'none' : value
}

function sectionTitleBase(
  theme: ThemeTokens,
  typography: TypographyScale,
  layout: LayoutProfile,
): CSSProperties {
  const withRule = layout.sectionTitleDecoration === 'rule'
  return {
    fontFamily: theme.fonts.previewHeading,
    fontSize: ptCss(typography.sectionSize),
    fontWeight: 700,
    color: theme.colors.accent,
    textTransform: textTransform(layout.sectionTitleTransform),
    letterSpacing: ptCss(typography.letterSpacingSection),
    marginBottom: ptCss(layout.sectionTitleGapPt),
    borderBottomWidth: withRule ? ptCss(layout.headerBorderWidthPt) : undefined,
    borderBottomStyle: withRule ? 'solid' : undefined,
    borderBottomColor: withRule ? theme.colors.border : undefined,
    paddingBottom: withRule ? ptCss(layout.bulletGapPt) : undefined,
  }
}

function buildCssStyles(
  theme: ThemeTokens,
  typography: TypographyScale,
  layout: LayoutProfile,
  page: PageDimensions,
): ResolvedCssStyles {
  const margin = ptCss(layout.pageMarginPt)
  const titleBase = sectionTitleBase(theme, typography, layout)

  return {
    page: {
      width: page.size === 'a4' ? '210mm' : '8.5in',
      maxWidth: '100%',
      minHeight: page.size === 'a4' ? '297mm' : '11in',
      boxSizing: 'border-box',
      padding: margin,
      backgroundColor: theme.colors.paper,
      position: 'relative',
    },
    root: {
      fontFamily: theme.fonts.previewBody,
      fontSize: ptCss(typography.bodySize),
      lineHeight: typography.lineHeight,
      color: theme.colors.text,
      maxWidth: '100%',
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
    },
    header: {
      textAlign: layout.headerAlign,
      marginBottom: 0,
      borderBottomWidth: layout.headerBorderBottom ? ptCss(layout.headerBorderWidthPt) : undefined,
      borderBottomStyle: layout.headerBorderBottom ? 'solid' : undefined,
      borderBottomColor: layout.headerBorderBottom ? theme.colors.border : undefined,
      paddingBottom: layout.headerBorderBottom
        ? ptCss(layout.headerRulePaddingPt)
        : undefined,
    },
    name: {
      fontFamily: theme.fonts.previewHeading,
      fontSize: ptCss(typography.nameSize),
      fontWeight: 700,
      color: theme.colors.accent,
      marginBottom: 0,
      lineHeight: 1.15,
    },
    headline: {
      fontFamily: theme.fonts.previewBody,
      fontSize: ptCss(typography.bodySize),
      fontWeight: 500,
      color: theme.colors.text,
      marginBottom: 0,
      lineHeight: 1.3,
    },
    meta: {
      fontSize: ptCss(typography.metaSize),
      color: theme.colors.textMuted,
      marginBottom: 0,
      lineHeight: layout.metaLineHeight,
    },
    sectionTitle: {
      ...titleBase,
      marginTop: 0,
    },
    sectionTitleFirst: {
      ...titleBase,
      marginTop: 0,
    },
    section: {
      marginBottom: 0,
    },
    subheading: {
      fontFamily: theme.fonts.previewHeading,
      fontSize: ptCss(typography.subheadingSize),
      fontWeight: 700,
      color: theme.colors.text,
    },
    body: {
      fontSize: ptCss(typography.bodySize),
      lineHeight: typography.lineHeight,
      color: theme.colors.text,
      marginBottom: ptCss(layout.paragraphGapPt),
    },
    bullet: {
      fontSize: ptCss(typography.bodySize),
      lineHeight: typography.lineHeight,
      paddingLeft: ptCss(layout.bulletIndentPt),
      marginBottom: ptCss(layout.bulletGapPt),
      textIndent: `-${ptCss(layout.bulletIndentPt)}`,
    },
    bulletItem: {
      fontSize: ptCss(typography.bodySize),
      lineHeight: typography.lineHeight,
      marginBottom: ptCss(layout.skillGroupGapPt),
    },
    itemBlock: {
      marginBottom: ptCss(layout.itemGapPt),
    },
    date: {
      fontSize: ptCss(typography.bodySize),
      color: theme.colors.textMuted,
      flexShrink: 0,
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: ptCss(8),
      alignItems: 'flex-start',
      marginBottom: ptCss(layout.bulletGapPt),
    },
  }
}

function pdfSectionTitleBase(
  theme: ThemeTokens,
  typography: TypographyScale,
  layout: LayoutProfile,
) {
  const withRule = layout.sectionTitleDecoration === 'rule'
  return {
    fontSize: typography.sectionSize,
    ...pdfHeadingStyle(theme.fonts),
    color: theme.colors.accent,
    textTransform: layout.sectionTitleTransform,
    letterSpacing: typography.letterSpacingSection,
    marginBottom: layout.sectionTitleGapPt,
    borderBottomWidth: withRule ? layout.headerBorderWidthPt : 0,
    borderBottomColor: theme.colors.border,
    paddingBottom: withRule ? layout.bulletGapPt : 0,
  }
}

function buildPdfStyles(
  theme: ThemeTokens,
  typography: TypographyScale,
  layout: LayoutProfile,
): ResolvedPdfStyles {
  const titleBase = pdfSectionTitleBase(theme, typography, layout)

  return {
    page: {
      padding: layout.pageMarginPt,
      fontSize: typography.bodySize,
      fontFamily: pdfBodyFamily(theme.fonts),
      lineHeight: typography.lineHeight,
      color: theme.colors.text,
      backgroundColor: theme.colors.paper,
    },
    section: {
      marginBottom: 0,
    },
    header: {
      textAlign: layout.headerAlign,
      marginBottom: 0,
      borderBottomWidth: layout.headerBorderBottom ? layout.headerBorderWidthPt : 0,
      borderBottomColor: theme.colors.border,
      paddingBottom: layout.headerBorderBottom ? layout.headerRulePaddingPt : 0,
    },
    name: {
      fontSize: typography.nameSize,
      ...pdfHeadingStyle(theme.fonts),
      color: theme.colors.accent,
      marginBottom: 0,
      lineHeight: 1.15,
    },
    headline: {
      fontSize: typography.bodySize,
      fontFamily: pdfBodyFamily(theme.fonts),
      color: theme.colors.text,
      marginTop: layout.nameToMetaPt,
      marginBottom: 0,
      lineHeight: 1.3,
    },
    meta: {
      fontSize: typography.metaSize,
      color: theme.colors.textMuted,
      marginBottom: 0,
      lineHeight: layout.metaLineHeight,
    },
    sectionTitle: {
      ...titleBase,
      marginTop: 0,
    },
    sectionTitleFirst: {
      ...titleBase,
      marginTop: 0,
    },
    subheading: {
      fontSize: typography.subheadingSize,
      ...pdfBoldStyle(theme.fonts),
      color: theme.colors.text,
    },
    body: {
      fontSize: typography.bodySize,
      lineHeight: typography.lineHeight,
      color: theme.colors.text,
      marginBottom: layout.paragraphGapPt,
    },
    bullet: {
      marginLeft: layout.bulletIndentPt,
      marginBottom: layout.bulletGapPt,
      fontSize: typography.bodySize,
      lineHeight: typography.lineHeight,
    },
    itemBlock: {
      marginBottom: layout.itemGapPt,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: layout.bulletGapPt,
      gap: 8,
    },
    bold: pdfBoldStyle(theme.fonts),
    italic: pdfItalicStyle(theme.fonts),
  }
}

export function resolveDocumentStyles(document: ResumeDocument): ResolvedStyles {
  const theme = getTheme(document.meta.themeId)
  const typography = mergeTypography(theme, document.meta)
  const layout = mergeLayout(theme, document.meta)
  const page = PAGE_MM[document.meta.pageSize]

  return {
    theme,
    typography,
    layout,
    page,
    css: buildCssStyles(theme, typography, layout, page),
    pdf: buildPdfStyles(theme, typography, layout),
  }
}

export function parityDeltaPt(cssPt: string | undefined, pdfPt: number): number {
  const parsed = cssPt ? Number.parseFloat(cssPt) : NaN
  if (Number.isNaN(parsed)) return Infinity
  return Math.abs(parsed - pdfPt)
}
