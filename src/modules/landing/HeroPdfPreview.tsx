import { CheckIcon } from 'lucide-react'

/**
 * Landing hero: page 1 of a REAL PDF exported by Rizzume's own engine from the fictional sample document, resting on a
 * "desk" surface. Pre-rendered (`pnpm run landing:previews`), so a first visit loads one image, not the PDF compiler.
 * The page stays white in both themes: it is paper.
 */

export function HeroPdfCard() {
  return (
    <figure className="m-0">
      <div className="desk-grain relative rounded-2xl bg-muted px-5 py-8 sm:px-10 sm:py-10">
        <div className="mx-auto w-full max-w-sm">
          <img
            src="/landing/hero.webp"
            alt="Sample resume exported as a PDF: Jordan Tan, software engineer"
            width={900}
            height={1273}
            fetchPriority="high"
            className="block h-auto w-full rounded-sm bg-paper shadow-lg ring-1 ring-paper-foreground/10"
          />
        </div>
        {/* The signature: a rubber stamp, like the one an approval desk would leave on the finished page. */}
        <span className="rb-stamp-in absolute right-3 bottom-5 inline-flex items-center gap-1.5 rounded-sm border-2 border-success-foreground bg-background px-3 py-1.5 text-xs font-bold tracking-[0.14em] text-success-foreground uppercase sm:right-6">
          <CheckIcon className="size-3.5" strokeWidth={3} aria-hidden />
          ATS passed
        </span>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        A4 · Malaysia Corporate. A real PDF exported by Rizzume from fictional sample data.
      </figcaption>
    </figure>
  )
}
