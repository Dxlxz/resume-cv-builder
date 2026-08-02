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
          Live preview
        </h2>
        <span className="text-xs text-muted-foreground">
          {document.meta.pageSize === 'letter' ? 'US Letter' : 'A4'} · {previewPageCount} page
          {previewPageCount === 1 ? '' : 's'}
          {pageDrift ? ` · plan expected ${plannedPages}` : ''}
          {isResume && previewPageCount > 2 ? ' · consider trimming' : ''}
          {layoutDebug ? ' · layout debug on' : ''}
        </span>
      </div>
      <p className="mb-3 shrink-0 text-xs text-muted-foreground">
        Embedded PDF viewer — select, copy, zoom, and scroll. Edit fields in the form on the left.
        {layoutDebug ? ' Layout debug panel shows the planned block rhythm.' : ''}
      </p>

      <div
        ref={measureRef}
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-md border border-border bg-[var(--gray-900)]"
      >
        <PdfJsPreview document={document} contentKey={contentKey} containerWidth={containerWidth} />
      </div>
    </div>
  )
}
