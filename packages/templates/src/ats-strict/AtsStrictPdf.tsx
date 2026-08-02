import type { ResumeDocument } from '@rb/core/types/document'
import { BlockLayoutPdf } from '@rb/templates/shared/BlockLayoutPdf'

interface AtsStrictPdfProps {
  document: ResumeDocument
}

export function AtsStrictPdf({ document }: AtsStrictPdfProps) {
  return <BlockLayoutPdf document={document} />
}
