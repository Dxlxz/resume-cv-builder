import type { ResumeDocument } from '@rb/core/types/document'
import { BlockLayoutPdf } from '@rb/templates/shared/BlockLayoutPdf'

interface BannerPdfProps {
  document: ResumeDocument
}

/** Geometry comes from TEMPLATE_LAYOUTS.banner — see layoutProfiles. */
export function BannerPdf({ document }: BannerPdfProps) {
  return <BlockLayoutPdf document={document} />
}
