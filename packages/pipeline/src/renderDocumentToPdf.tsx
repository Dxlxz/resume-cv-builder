import { pdf } from '@react-pdf/renderer'
import type { ResumeDocument } from '@rb/core/types/document'
import { ensurePdfFontsRegistered } from '@rb/render/fonts/registerPdfFonts'
import { ClassicPdf } from '@rb/templates/classic/ClassicPdf'
import { AcademicPdf } from '@rb/templates/academic/AcademicPdf'
import { AtsStrictPdf } from '@rb/templates/ats-strict/AtsStrictPdf'
import { ModernRailPdf } from '@rb/templates/modern-rail/ModernRailPdf'
import { BannerPdf } from '@rb/templates/banner/BannerPdf'
import { BlockLayoutPdf } from '@rb/templates/shared/BlockLayoutPdf'
import { ColumnLayoutPdf } from '@rb/templates/shared/ColumnLayoutPdf'

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
    case 'ivy':
    case 'compact':
    case 'executive':
    case 'harbor':
    case 'minimal':
      element = <BlockLayoutPdf document={document} />
      break
    case 'sidebar':
    case 'split':
    case 'slate':
      element = <ColumnLayoutPdf document={document} />
      break
    case 'academic':
      element = <AcademicPdf document={document} pageSize={document.meta.pageSize} />
      break
    case 'classic':
      element = <ClassicPdf document={document} pageSize={document.meta.pageSize} />
      break
    default: {
      // Compile-time guard: a template id without a case here is a type error, not a silent Classic.
      const unhandled: never = templateId
      throw new Error(`No renderer for template ${String(unhandled)}`)
    }
  }

  return pdf(element).toBlob()
}
