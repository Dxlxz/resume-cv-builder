import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface PdfPreviewModalProps {
  url: string
  pageCount: number
  onClose: () => void
  onDownload: () => void
}

export function PdfPreviewModal({ url, pageCount, onClose, onDownload }: PdfPreviewModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={`PDF preview, ${pageCount} pages`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-header px-4 py-3">
        <div>
          <h3 className="font-semibold text-foreground">
            PDF preview · {pageCount} page{pageCount === 1 ? '' : 's'}
          </h3>
          <p className="text-xs text-muted-foreground">
            Select and copy text with your mouse. Edit content in the form on the left. Esc to
            close.
          </p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </header>

      <iframe
        src={url}
        title="PDF export preview"
        className="min-h-0 w-full flex-1 border-0 bg-muted"
      />

      <footer className="flex shrink-0 justify-end gap-2 border-t border-border bg-header px-4 py-3">
        <Button type="button" variant="secondary" onClick={onClose}>
          Back to editor
        </Button>
        <Button type="button" onClick={onDownload}>
          Download PDF
        </Button>
      </footer>
    </div>
  )
}
