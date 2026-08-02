import { StyleSheet } from '@react-pdf/renderer'
import type { ResolvedStyles } from '@rb/styles/shared/types'
import { minPresenceForSection } from '@rb/templates/shared/spacingHelpers'

export function createPdfBlockStyles(resolved: ResolvedStyles) {
  const { pdf, theme, typography, layout } = resolved

  return StyleSheet.create({
    page: pdf.page,
    header: pdf.header,
    name: pdf.name,
    headline: pdf.headline,
    meta: pdf.meta,
    sectionTitle: pdf.sectionTitle,
    sectionTitleFirst: pdf.sectionTitleFirst,
    subheading: pdf.subheading,
    body: pdf.body,
    row: pdf.row,
    rowTight: { ...pdf.row, marginBottom: 0 },
    bold: pdf.bold,
    italic: pdf.italic,
    bullet: pdf.bullet,
    // Hanging bullet: glyph column + text column, mirrored in LayoutBlockHtml
    // so DOM measure and PDF wrap at identical widths.
    bulletRow: { flexDirection: 'row', marginBottom: layout.bulletGapPt },
    bulletRowLast: { flexDirection: 'row', marginBottom: 0 },
    bulletGlyph: {
      width: layout.bulletIndentPt,
      fontSize: typography.bodySize,
      lineHeight: typography.lineHeight,
      color: theme.colors.text,
    },
    bulletText: {
      flex: 1,
      fontSize: typography.bodySize,
      lineHeight: typography.lineHeight,
      color: theme.colors.text,
    },
    skillLine: {
      fontSize: typography.bodySize,
      lineHeight: typography.lineHeight,
      color: theme.colors.text,
    },
    itemBlock: pdf.itemBlock,
    muted: { color: theme.colors.textMuted, fontSize: typography.bodySize },
  })
}

export type PdfBlockStyles = ReturnType<typeof createPdfBlockStyles>

export function defaultMinPresence(resolved: ResolvedStyles): number {
  return minPresenceForSection(resolved.typography, resolved.layout)
}
