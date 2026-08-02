import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog'

interface PdfPreviewModalProps {
  url: string
  pageCount: number
  onClose: () => void
  onDownload: () => void
}

export function PdfPreviewModal({ url, pageCount, onClose, onDownload }: PdfPreviewModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent fullscreen aria-label={`PDF preview, ${pageCount} pages`}>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-header px-4 py-3">
          <div>
            <DialogTitle className="font-semibold text-foreground">
              PDF preview · {pageCount} page{pageCount === 1 ? '' : 's'}
            </DialogTitle>
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
      </DialogContent>
    </Dialog>
  )
}
