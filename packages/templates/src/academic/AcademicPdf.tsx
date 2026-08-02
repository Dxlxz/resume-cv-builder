import type { PageSize, ResumeDocument } from '@rb/core/types/document'
import { BlockLayoutPdf } from '@rb/templates/shared/BlockLayoutPdf'

interface AcademicPdfProps {
  document: ResumeDocument
  pageSize: PageSize
}

export function AcademicPdf({ document }: AcademicPdfProps) {
  return <BlockLayoutPdf document={document} />
}
