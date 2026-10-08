import { EyeOffIcon, TriangleAlertIcon } from 'lucide-react'
import type { ResumeDocument } from '@rb/core/types/document'
import { PdfJsPreview } from './PdfJsPreview'
import { useDocumentStore } from '@/modules/document'
import { Alert, AlertDescription } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

interface PreviewShellProps {
  document: ResumeDocument
  contentKey: string
  /** Desktop affordance to hide the preview column (also in the More menu). */
  onTogglePreview?: () => void
}

/** The "desk": the exported PDF in the browser's viewer, framed on a muted surface, with page facts above it. */
export function PreviewShell({ document, contentKey, onTogglePreview }: PreviewShellProps) {
  const isResume = document.meta.documentType === 'resume'
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const plannedPages = layoutPlan?.plan.pageCount
  const pageDrift = plannedPages !== undefined && plannedPages > 0 && plannedPages !== previewPageCount

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Preview</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" size="lg" radius="full">
            {document.meta.pageSize === 'letter' ? 'US Letter' : 'A4'} · {previewPageCount} page
            {previewPageCount === 1 ? '' : 's'}
            {pageDrift ? ` · export expected ${plannedPages}` : ''}
          </Badge>
          {onTogglePreview && (
            <Button type="button" variant="ghost" size="sm" onClick={onTogglePreview} className="hidden sm:inline-flex">
              <EyeOffIcon data-icon="inline-start" aria-hidden />
              Hide preview
            </Button>
          )}
        </div>
      </div>

      {isResume && previewPageCount > 2 && (
        <Alert variant="warning" className="mb-3 shrink-0">
          <TriangleAlertIcon aria-hidden />
          <AlertDescription>
            This resume is {previewPageCount} pages. Most roles expect 1 to 2 pages. Trim bullets or remove a section.
          </AlertDescription>
        </Alert>
      )}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-foreground/10">
        <PdfJsPreview document={document} contentKey={contentKey} />
      </div>
    </div>
  )
}
