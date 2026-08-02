import { useEffect, useRef, useState } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { PdfJsPreview } from '@/components/preview/PdfJsPreview'
import { useDocumentStore } from '@/app/store/documentStore'

interface PreviewShellProps {
  document: ResumeDocument
  contentKey: string
}

function stableWidth(width: number, previous: number): number {
  if (width <= 0) return previous
  if (previous <= 0) return width
  if (Math.abs(width - previous) <= 20) return previous
  return width
}

export function PreviewShell({ document, contentKey }: PreviewShellProps) {
  const isResume = document.meta.documentType === 'resume'
  const previewPageCount = useDocumentStore((s) => s.previewPageCount)
  const layoutPlan = useDocumentStore((s) => s.layoutPlan)
  const layoutDebug = useDocumentStore((s) => s.layoutDebug)
  const plannedPages = layoutPlan?.plan.pageCount
  const pageDrift =
    plannedPages !== undefined && plannedPages > 0 && plannedPages !== previewPageCount
  const measureRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = measureRef.current
    if (!el) return

    const measure = () => {
      setContainerWidth((prev) => stableWidth(el.clientWidth, prev))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [layoutDebug])

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Preview
        </h2>
        <span className="text-xs text-muted-foreground">
          {document.meta.pageSize === 'letter' ? 'US Letter' : 'A4'} · {previewPageCount} page
          {previewPageCount === 1 ? '' : 's'}
          {pageDrift ? ` · export expected ${plannedPages}` : ''}
        </span>
      </div>
      <p className="mb-3 shrink-0 text-xs text-muted-foreground">
        The preview is the exported PDF in your browser's viewer. Select,
        copy, and zoom to check it.
      </p>

      {isResume && previewPageCount > 2 && (
        <p className="mb-3 shrink-0 rounded-md border border-status-warning/30 bg-badge-warning px-3 py-2 text-xs text-status-warning-foreground">
          This resume is {previewPageCount} pages. Most roles expect 1 to 2
          pages. Trim bullets or remove a section.
        </p>
      )}

      <div
        ref={measureRef}
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-muted"
      >
        <PdfJsPreview document={document} contentKey={contentKey} containerWidth={containerWidth} />
      </div>
    </div>
  )
}
