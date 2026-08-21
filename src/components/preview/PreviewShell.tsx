import type { ResumeDocument } from '@rb/core/types/document'
import { PdfJsPreview } from '@/components/preview/PdfJsPreview'
import { useDocumentStore } from '@/store/documentStore'

interface PreviewShellProps {
  document: ResumeDocument
  contentKey: string
  /** Desktop affordance to hide the preview column (also in the More menu). */
  onTogglePreview?: () => void
}

export function PreviewShell({ document, contentKey, onTogglePreview }: PreviewShellProps) {
  const isResume = document.meta.documentType === 'resume'
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const plannedPages = layoutPlan?.plan.pageCount
  const pageDrift =
    plannedPages !== undefined && plannedPages > 0 && plannedPages !== previewPageCount

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Preview
        </h2>
        {onTogglePreview && (
          <button
            type="button"
            onClick={onTogglePreview}
            className="hidden rounded-sm border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted sm:inline-flex"
          >
            Hide preview
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          {document.meta.pageSize === 'letter' ? 'US Letter' : 'A4'} · {previewPageCount} page
          {previewPageCount === 1 ? '' : 's'}
          {pageDrift ? ` · export expected ${plannedPages}` : ''}
        </span>
      </div>

      {isResume && previewPageCount > 2 && (
        <p className="mb-3 shrink-0 rounded-md border border-status-warning/30 bg-badge-warning px-3 py-2 text-xs text-status-warning-foreground">
          This resume is {previewPageCount} pages. Most roles expect 1 to 2
          pages. Trim bullets or remove a section.
        </p>
      )}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-muted">
        <PdfJsPreview document={document} contentKey={contentKey} />
      </div>
    </div>
  )
}
