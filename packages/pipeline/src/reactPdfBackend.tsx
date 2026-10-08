import { Document, Page, pdf } from '@react-pdf/renderer'
import type { RenderBackend, RenderInput } from '@rb/render/types'
import { LayoutBlockPdf } from '@rb/render/blocks/LayoutBlockPdf'
import { createPdfBlockStyles, defaultMinPresence } from '@rb/render/blocks/pdfBlockStyles'

// eslint-disable-next-line react-refresh/only-export-components -- render backend module, not hot-reloaded UI
function LayoutDocumentPdf({ input }: { input: RenderInput }) {
  const sheet = createPdfBlockStyles(input.styles)
  const minPresence = defaultMinPresence(input.styles)

  return (
    <Document>
      <Page size={input.pageSize} style={sheet.page} wrap>
        {input.layout.blocks.map((block) => (
          <LayoutBlockPdf
            key={block.id}
            block={block}
            sheet={sheet}
            resolved={input.styles}
            minPresence={minPresence}
          />
        ))}
      </Page>
    </Document>
  )
}

export const reactPdfBackend: RenderBackend = {
  id: 'react-pdf',

  async render(input: RenderInput): Promise<Blob> {
    return pdf(<LayoutDocumentPdf input={input} />).toBlob()
  },
}
