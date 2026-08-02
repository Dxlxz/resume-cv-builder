import type { ResumeDocument } from '@rb/core/types/document'
import { PdfCanvasPreview } from '@/components/preview/PdfCanvasPreview'
import { useDocumentStore } from '@/app/store/documentStore'

interface PreviewShellProps {
  document: ResumeDocument
  contentKey: string
}

export function PreviewShell({ document, contentKey }: PreviewShellProps) {
  const isResume = document.meta.documentType === 'resume'
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const plannedPages = layoutPlan?.plan.pageCount
  const pageDrift =
    plannedPages !== undefined && plannedPages > 0 && plannedPages !== previewPageCount
  const showLayoutBoxes = useDocumentStore((s) => s.showLayoutBoxes)
  const setShowLayoutBoxes = useDocumentStore((s) => s.setShowLayoutBoxes)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </h2>
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showLayoutBoxes}
              onChange={(e) => setShowLayoutBoxes(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--primary)]"
            />
            Show boxes
          </label>
        </div>
        <span className="text-xs text-muted-foreground">
          {document.meta.pageSize === 'letter' ? 'US Letter' : 'A4'} · {previewPageCount} page
          {previewPageCount === 1 ? '' : 's'}
          {pageDrift ? ` · export expected ${plannedPages}` : ''}
        </span>
      </div>

      {isResume && !showLayoutBoxes && previewPageCount > 2 && (
        <p className="mb-3 shrink-0 rounded-md border border-status-warning/30 bg-badge-warning px-3 py-2 text-xs text-status-warning-foreground">
          This resume is {previewPageCount} pages. Most roles expect 1 to 2
          pages. Trim bullets or remove a section.
        </p>
      )}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-muted">
        <PdfCanvasPreview document={document} contentKey={contentKey} />
      </div>
    </div>
  )
}
