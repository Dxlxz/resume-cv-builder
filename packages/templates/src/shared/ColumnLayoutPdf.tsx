import { Document, Page, View } from '@react-pdf/renderer'
import type { ResumeDocument } from '@rb/core/types/document'
import type { ColumnId, LayoutBlock } from '@rb/layout/types'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { getActiveLayoutPlan } from '@rb/layout/pdfLayoutContext'
import { LayoutBlockPdf } from '@rb/render/blocks/LayoutBlockPdf'
import { createPdfBlockStyles, defaultMinPresence } from '@rb/render/blocks/pdfBlockStyles'
import { columnGeometry, getPageSpec, inverseResolvedStyles, resolveDocumentStyles, SIDEBAR_RULE_PT } from '@rb/styles/shared'

interface ColumnLayoutPdfProps {
  document: ResumeDocument
}

/**
 * Two-column PDF, one explicit <Page> per planned page.
 *
 * Single-column templates let react-pdf's own flow break the page. That does
 * not work here: two columns have to break independently, and a wrapping row
 * would split both at the same point. Since the plan already knows which block
 * belongs on which page and in which column, the pages are emitted directly and
 * nothing is left to react-pdf's flow — which is what the measure + plan
 * pipeline exists to make possible.
 */
export function ColumnLayoutPdf({ document }: ColumnLayoutPdfProps) {
  const resolved = resolveDocumentStyles(document)
  const { layout, theme } = resolved
  const pageSize = document.meta.pageSize === 'a4' ? 'A4' : 'LETTER'
  const planResult = getActiveLayoutPlan()
  const compiled = planResult?.layout ?? compileLayout(document)
  const sheet = createPdfBlockStyles(resolved)
  const minPresence = defaultMinPresence(resolved)
  // An inverse rail is the accent colour with paper-coloured text; only colours differ, so the plan still holds.
  const inverse = layout.sidebarBackground && layout.sidebarInverse
  const railResolved = inverse ? inverseResolvedStyles(resolved) : resolved
  const railSheet = inverse ? createPdfBlockStyles(railResolved) : sheet

  const blocksById = new Map<string, LayoutBlock>(compiled.blocks.map((b) => [b.id, b]))

  // Without a plan (no DOM to measure in) everything lands on one page rather
  // than throwing — the same fallback posture as the single-column path.
  const pageCount = planResult?.plan.pageCount ?? 1
  const slices = planResult?.plan.slices ?? compiled.blocks.map((block) => ({
    pageIndex: 0,
    blockId: block.id,
    yPt: 0,
    column: block.column,
  }))

  const blocksFor = (pageIndex: number, column: ColumnId): LayoutBlock[] =>
    slices
      .filter((slice) => slice.pageIndex === pageIndex && (slice.column ?? 'main') === column)
      .map((slice) => blocksById.get(slice.blockId))
      .filter((block): block is LayoutBlock => Boolean(block))

  const sideOnRight = layout.sidebarSide === 'right'
  const geometry = columnGeometry(layout, getPageSpec(document).widthMm * (72 / 25.4))

  // The rail is a fixed-width column. A right rail is also written second, so a text extractor meets the main column first.
  const rail = (pageIndex: number) => (
    <View
      style={{
        width: geometry.railOuterPt,
        height: '100%',
        backgroundColor: inverse ? theme.colors.accent : layout.sidebarBackground ? theme.colors.border : undefined,
        paddingTop: layout.pageMarginPt,
        paddingBottom: layout.pageMarginPt,
        paddingLeft: geometry.railPaddingLeftPt,
        paddingRight: geometry.railPaddingRightPt,
        borderLeft: sideOnRight && layout.sidebarRule ? `${SIDEBAR_RULE_PT}pt solid ${theme.colors.border}` : undefined,
        borderRight: !sideOnRight && layout.sidebarRule ? `${SIDEBAR_RULE_PT}pt solid ${theme.colors.border}` : undefined,
      }}
    >
      {blocksFor(pageIndex, 'side').map((block) => (
        <LayoutBlockPdf key={block.id} block={block} sheet={railSheet} resolved={railResolved} minPresence={minPresence} />
      ))}
    </View>
  )

  const main = (pageIndex: number) => (
    <View
      style={{
        flex: 1,
        paddingTop: layout.pageMarginPt,
        paddingBottom: layout.pageMarginPt,
        paddingLeft: geometry.mainPaddingLeftPt,
        paddingRight: geometry.mainPaddingRightPt,
      }}
    >
      {blocksFor(pageIndex, 'main').map((block) => (
        <LayoutBlockPdf key={block.id} block={block} sheet={sheet} resolved={resolved} minPresence={minPresence} />
      ))}
    </View>
  )

  return (
    <Document>
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <Page key={pageIndex} size={pageSize} style={{ ...sheet.page, padding: 0 }}>
          {/* The rail is painted for the full page height regardless of how much content it holds, otherwise a
              short rail leaves a half-painted band down the page. */}
          <View style={{ flexDirection: 'row', height: '100%' }}>
            {sideOnRight ? (
              <>
                {main(pageIndex)}
                {rail(pageIndex)}
              </>
            ) : (
              <>
                {rail(pageIndex)}
                {main(pageIndex)}
              </>
            )}
          </View>
        </Page>
      ))}
    </Document>
  )
}
