import { pdf } from '@react-pdf/renderer'
import type { ResumeDocument } from '@rb/core/types/document'
import { ensurePdfFontsRegistered } from './fonts/registerPdfFonts'
import { ClassicPdf } from '@rb/templates/classic/ClassicPdf'
import { AcademicPdf } from '@rb/templates/academic/AcademicPdf'
import { AtsStrictPdf } from '@rb/templates/ats-strict/AtsStrictPdf'
import { ModernRailPdf } from '@rb/templates/modern-rail/ModernRailPdf'
import { BannerPdf } from '@rb/templates/banner/BannerPdf'

export async function renderDocumentToPdf(document: ResumeDocument): Promise<Blob> {
  await ensurePdfFontsRegistered()

  const { templateId } = document.meta
  let element

  switch (templateId) {
    case 'ats-strict':
      element = <AtsStrictPdf document={document} />
      break
    case 'modern-rail':
      element = <ModernRailPdf document={document} />
      break
    case 'banner':
      element = <BannerPdf document={document} />
      break
    case 'academic':
      element = <AcademicPdf document={document} pageSize={document.meta.pageSize} />
      break
    default:
      element = <ClassicPdf document={document} pageSize={document.meta.pageSize} />
  }

  return pdf(element).toBlob()
}
