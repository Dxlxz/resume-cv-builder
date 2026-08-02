import type { ResumeDocument } from '@rb/core/types/document'
import { PdfJsPreview } from '@/components/preview/PdfJsPreview'
import { LayoutBoxesView } from '@/components/preview/LayoutBoxesView'
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
  const layer = useDocumentStore((s) => s.previewLayer)
  const setPreviewLayer = useDocumentStore((s) => s.setPreviewLayer)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Preview
          </h2>
          <div className="flex rounded-sm border border-border p-0.5" role="group" aria-label="Preview layer">
            <button
              type="button"
              onClick={() => setPreviewLayer('pdf')}
              aria-pressed={layer === 'pdf'}
              className={`rounded-sm px-2.5 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
                layer === 'pdf'
                  ? 'bg-card text-foreground shadow-[var(--shadow-raised)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => setPreviewLayer('layout')}
              aria-pressed={layer === 'layout'}
              className={`rounded-sm px-2.5 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
                layer === 'layout'
                  ? 'bg-card text-foreground shadow-[var(--shadow-raised)]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Layout
            </button>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {document.meta.pageSize === 'letter' ? 'US Letter' : 'A4'} · {previewPageCount} page
          {previewPageCount === 1 ? '' : 's'}
          {pageDrift ? ` · export expected ${plannedPages}` : ''}
        </span>
      </div>

      {isResume && layer === 'pdf' && previewPageCount > 2 && (
        <p className="mb-3 shrink-0 rounded-md border border-status-warning/30 bg-badge-warning px-3 py-2 text-xs text-status-warning-foreground">
          This resume is {previewPageCount} pages. Most roles expect 1 to 2
          pages. Trim bullets or remove a section.
        </p>
      )}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-muted">
        {layer === 'pdf' ? (
          <PdfJsPreview document={document} contentKey={contentKey} />
        ) : (
          <LayoutBoxesView />
        )}
      </div>
    </div>
  )
}
