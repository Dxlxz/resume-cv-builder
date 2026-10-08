import { PdfPageViewer, preferCanvasPdf } from '@/modules/pdf'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

interface PdfPreviewModalProps {
  url: string
  blob: Blob
  pageCount: number
  onClose: () => void
  onDownload: () => void
}

export function PdfPreviewModal({ url, blob, pageCount, onClose, onDownload }: PdfPreviewModalProps) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 ring-0 sm:max-w-none"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-4 py-3">
          <div>
            <DialogTitle className="font-semibold text-foreground">
              PDF preview · {pageCount} page{pageCount === 1 ? '' : 's'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select and copy text with your mouse. Edit content in the form on the left. Esc to close.
            </DialogDescription>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </header>

        {preferCanvasPdf() ? (
          <PdfPageViewer blob={blob} fallbackHref={url} className="min-h-0 w-full flex-1 overflow-y-auto bg-muted p-2" />
        ) : (
          <iframe src={url} title="PDF export preview" className="min-h-0 w-full flex-1 border-0 bg-muted" />
        )}

        <footer className="flex shrink-0 justify-end gap-2 border-t border-border bg-background px-4 py-3">
          <Button type="button" variant="outline" onClick={onClose}>
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
