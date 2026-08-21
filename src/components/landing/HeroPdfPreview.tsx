import { sampleResumeDocument } from '@rb/fixtures'
import { useSamplePdfPreview } from '@/components/landing/samplePdf'
import { PdfSkeleton } from '@/components/landing/PdfSkeleton'

/**
 * Landing hero: a REAL exported PDF, generated in the browser from the
 * fictional sample document. The skeleton doubles as the loading state, so
 * the claim "the preview is the exported PDF" is shown, not told.
 */

export function HeroPdfCard() {
  const { dataUrl, pageCount, failed } = useSamplePdfPreview(sampleResumeDocument)

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-raised)]">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/25" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/25" />
          <span className="ml-3 rounded-full bg-card px-2.5 py-0.5 text-[10px] text-muted-foreground">
            resume.pdf
          </span>
        </div>
        <div className="flex items-stretch justify-center gap-6 bg-muted/60 px-5 py-6 sm:px-8">
          {dataUrl && !failed ? (
            <img
              src={dataUrl}
              alt="Sample resume exported as a PDF"
              className="mx-auto block max-h-[24rem] w-auto max-w-full rounded-sm border border-border bg-card shadow-[var(--shadow-raised)]"
            />
          ) : (
            <PdfSkeleton />
          )}
          <div className="hidden flex-col items-center justify-center gap-4 sm:flex">
            {/* The signature: a rubber stamp, like the one an approval desk
                would leave on the finished document. */}
            <span className="rb-stamp-in inline-flex rotate-[-4deg] items-center gap-1.5 rounded-sm border-2 border-status-success-foreground px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-status-success-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              ATS passed
            </span>
            <span className="text-xs text-muted-foreground">
              {pageCount ? `A4 · ${pageCount} pages · Malaysia Corporate` : 'A4 · Malaysia Corporate'}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        A real exported PDF, generated in your browser. Fictional sample data.
      </p>
    </div>
  )
}
