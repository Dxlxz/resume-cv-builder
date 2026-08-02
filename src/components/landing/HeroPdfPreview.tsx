import { useEffect, useState } from 'react'
import { generatePdf } from '@/lib/pdf'
import { renderPdfBlobToPages } from '@/renderers/pdf/renderPdfWithPdfJs'
import { sampleResumeDocument } from '@rb/fixtures'
import { getPreset } from '@rb/presets/registry'

/**
 * Landing hero: a REAL exported PDF, generated in the browser from the
 * fictional sample document. The skeleton (ResumeMock) doubles as the
 * loading state, so the claim "the preview is the exported PDF" is shown,
 * not told.
 */

const RENDER_WIDTH = 420

interface HeroPdfState {
  dataUrl: string | null
  pageCount: number
  failed: boolean
}

function useHeroPdfPreview(): HeroPdfState {
  const [state, setState] = useState<HeroPdfState>({
    dataUrl: null,
    pageCount: 0,
    failed: false,
  })

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const preset = getPreset(sampleResumeDocument.meta.presetId)
        const blob = await generatePdf(sampleResumeDocument, preset.labels)
        if (cancelled) return
        const { pages, pageCount } = await renderPdfBlobToPages(blob, {
          zoomMode: 'fit',
          containerWidth: RENDER_WIDTH,
        })
        if (cancelled) return
        setState({ dataUrl: pages[0]?.dataUrl ?? null, pageCount, failed: false })
      } catch {
        if (!cancelled) setState({ dataUrl: null, pageCount: 0, failed: true })
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}

/** Abstract resume skeleton — shown while the real PDF renders. */
function ResumeMock() {
  const bar = (w: string, tone: 'fg' | 'muted' | 'faint') =>
    `h-2 rounded-full ${w} ${
      tone === 'fg'
        ? 'bg-foreground/70'
        : tone === 'muted'
          ? 'bg-foreground/40'
          : 'bg-foreground/20'
    }`
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-raised)]">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20" />
        <div className="flex-1 space-y-1.5">
          <div className={bar('w-2/3', 'fg')} />
          <div className={bar('w-2/5', 'muted')} />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <div className={bar('w-1/4', 'fg')} />
        <div className={bar('w-full', 'muted')} />
        <div className={bar('w-11/12', 'muted')} />
        <div className={bar('w-4/5', 'faint')} />
      </div>
      <div className="mt-5 space-y-3">
        <div className={bar('w-1/4', 'fg')} />
        <div className={bar('w-full', 'muted')} />
        <div className={bar('w-3/4', 'faint')} />
        <div className={bar('w-10/12', 'muted')} />
        <div className={bar('w-2/3', 'faint')} />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-status-success" />
        <div className={bar('w-1/3', 'muted')} />
      </div>
    </div>
  )
}

export function HeroPdfCard() {
  const { dataUrl, pageCount, failed } = useHeroPdfPreview()

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
        <div className="flex items-stretch justify-center gap-6 bg-muted/60 px-6 py-8 sm:px-10">
          {dataUrl && !failed ? (
            <img
              src={dataUrl}
              alt="Sample resume exported as a PDF"
              className="w-full max-w-sm rounded-sm border border-border bg-card shadow-[var(--shadow-raised)]"
            />
          ) : (
            <ResumeMock />
          )}
          <div className="hidden flex-col items-start justify-center gap-4 sm:flex">
            <span className="inline-flex items-center gap-2 rounded-full border border-status-success/30 bg-badge-success px-3 py-1.5 text-xs font-medium text-status-success-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6L9 17l-5-5" />
              </svg>
              ATS check passed
            </span>
            <span className="text-xs text-muted-foreground">
              {pageCount ? `A4 · ${pageCount} pages · Malaysia Corporate` : 'A4 · Malaysia Corporate'}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-background/60">
        A real exported PDF, generated in your browser. Fictional sample data.
      </p>
    </div>
  )
}
