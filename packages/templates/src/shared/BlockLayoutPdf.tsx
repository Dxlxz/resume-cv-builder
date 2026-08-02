import { Document, Page } from '@react-pdf/renderer'
import type { ResumeDocument } from '@rb/core/types/document'
import { compileLayout } from '@rb/layout/compile/compileLayout'
import { getActiveLayoutPlan } from '@rb/layout/pdfLayoutContext'
import { LayoutBlockPdf } from '@rb/render/blocks/LayoutBlockPdf'
import { createPdfBlockStyles, defaultMinPresence } from '@rb/render/blocks/pdfBlockStyles'
import { resolveDocumentStyles } from '@rb/styles/shared'

interface BlockLayoutPdfProps {
  document: ResumeDocument
}

/** Block-driven PDF — spacing from layout IR; template differences via resolveDocumentStyles only. */
export function BlockLayoutPdf({ document }: BlockLayoutPdfProps) {
  const resolved = resolveDocumentStyles(document)
  const pageSize = document.meta.pageSize === 'a4' ? 'A4' : 'LETTER'
  const planResult = getActiveLayoutPlan()
  const layout = planResult?.layout ?? compileLayout(document)
  const sheet = createPdfBlockStyles(resolved)
  const minPresence = defaultMinPresence(resolved)

  return (
    <Document>
      <Page size={pageSize} style={sheet.page} wrap>
        {layout.blocks.map((block) => (
          <LayoutBlockPdf
            key={block.id}
            block={block}
            sheet={sheet}
            resolved={resolved}
            minPresence={minPresence}
          />
        ))}
      </Page>
    </Document>
  )
}
