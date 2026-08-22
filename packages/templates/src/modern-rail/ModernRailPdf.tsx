import type { ResumeDocument } from '@rb/core/types/document'
import { BlockLayoutPdf } from '@rb/templates/shared/BlockLayoutPdf'

interface ModernRailPdfProps {
  document: ResumeDocument
}

/** Geometry comes from TEMPLATE_LAYOUTS['modern-rail'] — see layoutProfiles. */
export function ModernRailPdf({ document }: ModernRailPdfProps) {
  return <BlockLayoutPdf document={document} />
}
