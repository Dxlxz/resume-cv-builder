import { Document, Page, View } from '@react-pdf/renderer'
import type { ResumeDocument } from '@rb/core/types/document'
import type { ColumnId, LayoutBlock } from '@rb/layout/types'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { getActiveLayoutPlan } from '@rb/layout/pdfLayoutContext'
import { LayoutBlockPdf } from '@rb/render/blocks/LayoutBlockPdf'
import { createPdfBlockStyles, defaultMinPresence } from '@rb/render/blocks/pdfBlockStyles'
import { resolveDocumentStyles } from '@rb/styles/shared'

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

  return (
    <Document>
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <Page key={pageIndex} size={pageSize} style={{ ...sheet.page, padding: 0 }}>
          <View style={{ flexDirection: 'row', height: '100%' }}>
            {/* The rail is painted for the full page height regardless of how
                much content it holds — otherwise a short sidebar leaves a
                half-painted band down the page. */}
            <View
              style={{
                width: layout.sidebarWidthPt,
                height: '100%',
                backgroundColor: layout.sidebarBackground ? theme.colors.border : undefined,
                paddingTop: layout.pageMarginPt,
                paddingBottom: layout.pageMarginPt,
                paddingLeft: layout.pageMarginPt,
                paddingRight: layout.sidebarGutterPt,
              }}
            >
              {blocksFor(pageIndex, 'side').map((block) => (
                <LayoutBlockPdf
                  key={block.id}
                  block={block}
                  sheet={sheet}
                  resolved={resolved}
                  minPresence={minPresence}
                />
              ))}
            </View>

            <View
              style={{
                flex: 1,
                paddingTop: layout.pageMarginPt,
                paddingBottom: layout.pageMarginPt,
                paddingLeft: layout.sidebarGutterPt,
                paddingRight: layout.pageMarginPt,
              }}
            >
              {blocksFor(pageIndex, 'main').map((block) => (
                <LayoutBlockPdf
                  key={block.id}
                  block={block}
                  sheet={sheet}
                  resolved={resolved}
                  minPresence={minPresence}
                />
              ))}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  )
}
