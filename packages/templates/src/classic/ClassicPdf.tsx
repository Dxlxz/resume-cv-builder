import type { PageSize, ResumeDocument } from '@rb/core/types/document'
import { BlockLayoutPdf } from '@rb/templates/shared/BlockLayoutPdf'

interface ClassicPdfProps {
  document: ResumeDocument
  pageSize: PageSize
}

export function ClassicPdf({ document }: ClassicPdfProps) {
  return <BlockLayoutPdf document={document} />
}
