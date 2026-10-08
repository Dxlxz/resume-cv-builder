import { cn } from 'cn'

interface BrandProps {
  showName?: boolean
  nameClassName?: string
  /** When provided, the brand renders as a button (logo = home). */
  onClick?: () => void
}

/**
 * The page and its "r": the outline of the resume page with its corner folded, carrying the bold italic "r" of
 * Source Serif 4 (the display face, OFL) as a path, so the mark never waits for a font. Solid brand blue in each theme;
 * the same drawing is public/favicon.svg.
 */
const BRAND_PAGE_PATH = 'M8 3h13l5 5v19.5a1.5 1.5 0 0 1-1.5 1.5h-16A1.5 1.5 0 0 1 7 27.5v-23A1.5 1.5 0 0 1 8.5 3Z'
const BRAND_FOLD_PATH = 'M21 3v3.5A1.5 1.5 0 0 0 22.5 8H26Z'
const BRAND_R_PATH =
  'M9.72 24.47 11.84 14.53 9.82 14.38 10.07 13.11 14.97 11.60 15.68 11.93 14.87 16.50 15.02 16.52Q15.55 15.13 16.16 14.07Q16.81 12.91 17.59 12.27Q18.38 11.63 19.28 11.63Q20.19 11.63 20.75 12.05Q21.30 12.48 21.48 13.14Q21.43 14.00 20.95 14.60Q20.47 15.21 19.61 15.21Q18.86 15.21 18.43 14.86Q18.02 14.55 17.57 14.02Q17.11 14.58 16.69 15.21Q16.18 15.99 15.68 17.00Q15.30 17.73 14.89 18.64Q14.57 20.18 14.26 21.62Q13.96 23.08 13.66 24.52L10.45 24.80Z'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden focusable={false} className={className}>
      <path d={BRAND_PAGE_PATH} className="fill-primary" />
      <path d={BRAND_FOLD_PATH} className="fill-primary-foreground/45" />
      <path d={BRAND_R_PATH} className="fill-primary-foreground" />
    </svg>
  )
}

export function Brand({ showName = true, nameClassName = '', onClick }: BrandProps) {
  const content = (
    <>
      <BrandMark />
      {showName && (
        <span className={cn('font-display text-lg font-semibold tracking-tight text-foreground', nameClassName)}>
          Rizzume
        </span>
      )}
    </>
  )

  if (!onClick) {
    return <span className="flex items-center gap-2">{content}</span>
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Rizzume - home"
      title="Home"
      className="flex items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {content}
    </button>
  )
}
