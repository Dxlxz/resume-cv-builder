import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/Dialog'
import { PdfCanvasPages } from '@/components/preview/PdfCanvasPages'

interface PdfPreviewModalProps {
  blob: Blob
  pageCount: number
  onClose: () => void
  onDownload: () => void
}

export function PdfPreviewModal({ blob, pageCount, onClose, onDownload }: PdfPreviewModalProps) {
  const [zoomMode, setZoomMode] = useState<'fit' | '100'>('fit')

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent fullscreen aria-label={`PDF preview, ${pageCount} pages`}>
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-header px-4 py-3">
          <div>
            <DialogTitle className="font-semibold text-foreground">
              PDF preview · {pageCount} page{pageCount === 1 ? '' : 's'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Full-size preview of your export. Esc to close.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex rounded-sm border border-border p-0.5"
              role="group"
              aria-label="Zoom"
            >
              <button
                type="button"
                onClick={() => setZoomMode('fit')}
                aria-pressed={zoomMode === 'fit'}
                className={`rounded-sm px-2.5 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
                  zoomMode === 'fit'
                    ? 'bg-card text-foreground shadow-[var(--shadow-raised)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Fit
              </button>
              <button
                type="button"
                onClick={() => setZoomMode('100')}
                aria-pressed={zoomMode === '100'}
                className={`rounded-sm px-2.5 py-0.5 text-xs transition-colors duration-[var(--duration-state)] ${
                  zoomMode === '100'
                    ? 'bg-card text-foreground shadow-[var(--shadow-raised)]'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                100%
              </button>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </header>

        <div className="min-h-0 w-full flex-1 bg-muted">
          <PdfCanvasPages blob={blob} zoomMode={zoomMode} />
        </div>

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
