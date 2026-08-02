import type { CSSProperties } from 'react'
import type { Style } from '@react-pdf/types'
import type { PageSize } from '@rb/core/types/document'
import type { LayoutProfile, ThemeTokens, TypographyScale } from '@rb/themes/types'

export type PdfStyle = Style

export interface PageDimensions {
  widthMm: number
  heightMm: number
  size: PageSize
}

export interface ResolvedCssStyles {
  page: CSSProperties
  root: CSSProperties
  header: CSSProperties
  name: CSSProperties
  headline: CSSProperties
  meta: CSSProperties
  sectionTitle: CSSProperties
  sectionTitleFirst: CSSProperties
  section: CSSProperties
  subheading: CSSProperties
  body: CSSProperties
  bullet: CSSProperties
  bulletItem: CSSProperties
  itemBlock: CSSProperties
  date: CSSProperties
  row: CSSProperties
}

export interface ResolvedPdfStyles {
  page: PdfStyle
  section: PdfStyle
  name: PdfStyle
  headline: PdfStyle
  meta: PdfStyle
  sectionTitle: PdfStyle
  sectionTitleFirst: PdfStyle
  subheading: PdfStyle
  body: PdfStyle
  bullet: PdfStyle
  itemBlock: PdfStyle
  row: PdfStyle
  bold: PdfStyle
  italic: PdfStyle
  header: PdfStyle
}

export interface ResolvedStyles {
  theme: ThemeTokens
  typography: TypographyScale
  layout: LayoutProfile
  page: PageDimensions
  css: ResolvedCssStyles
  pdf: ResolvedPdfStyles
}
