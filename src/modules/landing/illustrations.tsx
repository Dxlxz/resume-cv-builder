/**
 * Landing illustrations, drawn for Rizzume (F-008 highlights, F-009 how-it-works steps). Each one shows what the product actually does, in the "paper desk"
 * direction: a white page, its text lines, the app around it. Inline SVG with semantic tokens only, so they follow the
 * light and dark themes and cost nothing to load. Decorative: the text beside each one carries the meaning.
 */

const svgProps = {
  'aria-hidden': true,
  focusable: false,
  className: 'block h-auto w-full',
} as const

/** Text lines on a page: widths in viewBox units, one row every `gap`. */
function Lines({ x, y, widths, gap = 9, className = 'fill-paper-foreground/20' }: {
  x: number
  y: number
  widths: number[]
  gap?: number
  className?: string
}) {
  return (
    <>
      {widths.map((w, i) => (
        <rect key={i} x={x} y={y + i * gap} width={w} height={3.5} rx={1.75} className={className} />
      ))}
    </>
  )
}

/** A resume page: name, a rule, and three short sections. */
function Page({ x, y, w = 96, h = 132 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} className="fill-paper stroke-border" strokeWidth={1} />
      <rect x={x + 12} y={y + 12} width={44} height={6} rx={3} className="fill-primary" />
      <Lines x={x + 12} y={y + 23} widths={[58]} className="fill-paper-foreground/30" />
      <rect x={x + 12} y={y + 33} width={w - 24} height={1} className="fill-paper-foreground/15" />
      <Lines x={x + 12} y={y + 40} widths={[26]} className="fill-primary/60" />
      <Lines x={x + 12} y={y + 48} widths={[w - 24, w - 34, w - 28]} gap={7} />
      <Lines x={x + 12} y={y + 74} widths={[30]} className="fill-primary/60" />
      <Lines x={x + 12} y={y + 82} widths={h >= 110 ? [w - 30, w - 24, w - 40] : [w - 30, w - 24]} gap={7} />
      {h >= 126 && (
        <>
          <Lines x={x + 12} y={y + 108} widths={[22]} className="fill-primary/60" />
          <Lines x={x + 12} y={y + 116} widths={[w - 44]} gap={7} />
        </>
      )}
    </g>
  )
}

/** The form on the left, the page it produces on the right. */
export function PreviewIsPdfIllustration() {
  return (
    <svg viewBox="0 0 280 170" {...svgProps}>
      <rect x={8} y={18} width={112} height={134} rx={8} className="fill-card stroke-border" strokeWidth={1} />
      {[30, 62, 94].map((y) => (
        <g key={y}>
          <rect x={20} y={y} width={36} height={4} rx={2} className="fill-muted-foreground/50" />
          <rect x={20} y={y + 9} width={88} height={14} rx={4} className="fill-background stroke-border" strokeWidth={1} />
        </g>
      ))}
      <rect x={20} y={126} width={52} height={14} rx={4} className="fill-primary" />
      <path d="M128 85 h22" className="stroke-primary" strokeWidth={2} strokeDasharray="3 3" fill="none" />
      <path d="M148 80 l6 5 -6 5" className="stroke-primary" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Page x={168} y={19} />
    </svg>
  )
}

/** A page being read like a parser would, each extracted line ticked off. */
export function ReadBackIllustration() {
  const rows = [36, 56, 76, 96, 116]
  return (
    <svg viewBox="0 0 280 170" {...svgProps}>
      <Page x={14} y={19} />
      <rect x={14} y={70} width={96} height={16} className="fill-primary/15" />
      <rect x={14} y={77} width={96} height={1.5} className="fill-primary" />
      <path d="M118 85 h20" className="stroke-primary" strokeWidth={2} strokeDasharray="3 3" fill="none" />
      <path d="M136 80 l6 5 -6 5" className="stroke-primary" strokeWidth={2} fill="none" strokeLinecap="round" />
      <rect x={152} y={19} width={118} height={132} rx={8} className="fill-card stroke-border" strokeWidth={1} />
      <rect x={164} y={26} width={40} height={4} rx={2} className="fill-muted-foreground/50" />
      {rows.map((y, i) => (
        <g key={y}>
          <circle cx={170} cy={y + 6} r={5} className="fill-success" />
          <path
            d={`M167.5 ${y + 6} l1.8 1.8 3.4 -3.6`}
            className="stroke-success-foreground"
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x={181} y={y + 4} width={[72, 58, 66, 50, 62][i]} height={4} rx={2} className="fill-foreground/25" />
        </g>
      ))}
    </svg>
  )
}

/** The document inside the browser, locked; the cloud outside, crossed out. */
export function LocalOnlyIllustration() {
  return (
    <svg viewBox="0 0 280 170" {...svgProps}>
      <rect x={10} y={14} width={176} height={142} rx={10} className="fill-card stroke-border" strokeWidth={1} />
      <rect x={10} y={14} width={176} height={20} rx={10} className="fill-muted" />
      <rect x={10} y={28} width={176} height={6} className="fill-muted" />
      {[22, 32, 42].map((cx) => (
        <circle key={cx} cx={cx} cy={24} r={3} className="fill-muted-foreground/40" />
      ))}
      <rect x={56} y={20} width={110} height={8} rx={4} className="fill-background" />
      <Page x={48} y={42} w={80} h={104} />
      <g>
        <circle cx={138} cy={128} r={15} className="fill-primary" />
        <rect x={131.5} y={126} width={13} height={10} rx={2} className="fill-primary-foreground" />
        <path d="M134 126 v-3 a4 4 0 0 1 8 0 v3" className="stroke-primary-foreground" strokeWidth={2} fill="none" />
      </g>
      <path
        d="M212 92 a14 14 0 0 1 3 -27 a18 18 0 0 1 34 4 a12 12 0 0 1 3 23 z"
        className="stroke-muted-foreground"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        fill="none"
      />
      <path d="M208 102 L258 58" className="stroke-muted-foreground" strokeWidth={2} strokeLinecap="round" />
      <path d="M194 84 h10" className="stroke-muted-foreground/60" strokeWidth={1.5} strokeDasharray="2 3" />
    </svg>
  )
}


/** Step 1: two presets, one chosen. A4 is the taller page, US Letter the wider one. */
export function ChoosePresetIllustration() {
  return (
    <svg viewBox="0 0 160 96" {...svgProps}>
      <rect x={10} y={8} width={64} height={80} rx={8} className="fill-card stroke-primary" strokeWidth={2} />
      <rect x={28} y={18} width={28} height={40} rx={2} className="fill-paper stroke-border" strokeWidth={1} />
      <Lines x={32} y={24} widths={[14, 20, 16, 18]} gap={7} />
      <rect x={22} y={66} width={40} height={4} rx={2} className="fill-foreground/50" />
      <rect x={28} y={74} width={28} height={3} rx={1.5} className="fill-muted-foreground/50" />
      <circle cx={66} cy={16} r={7} className="fill-primary" />
      <path d="M62.8 16 l2.2 2.2 4.2 -4.4" className="stroke-primary-foreground" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <rect x={86} y={8} width={64} height={80} rx={8} className="fill-card stroke-border" strokeWidth={1} />
      <rect x={101} y={20} width={34} height={36} rx={2} className="fill-paper stroke-border" strokeWidth={1} />
      <Lines x={105} y={26} widths={[18, 24, 20, 22]} gap={7} />
      <rect x={98} y={66} width={40} height={4} rx={2} className="fill-foreground/50" />
      <rect x={104} y={74} width={28} height={3} rx={1.5} className="fill-muted-foreground/50" />
    </svg>
  )
}

/** Step 2: typing in a field changes the matching line on the page. */
export function FillDetailsIllustration() {
  return (
    <svg viewBox="0 0 160 96" {...svgProps}>
      <rect x={6} y={22} width={30} height={4} rx={2} className="fill-muted-foreground/50" />
      <rect x={6} y={30} width={70} height={20} rx={5} className="fill-background stroke-primary" strokeWidth={1.5} />
      <rect x={13} y={38} width={34} height={4} rx={2} className="fill-foreground/40" />
      <rect x={50} y={35} width={1.6} height={10} className="fill-primary" />
      <rect x={6} y={58} width={30} height={4} rx={2} className="fill-muted-foreground/50" />
      <rect x={6} y={66} width={70} height={20} rx={5} className="fill-background stroke-border" strokeWidth={1} />
      <path d="M82 40 h12" className="stroke-primary" strokeWidth={2} strokeDasharray="3 3" fill="none" />
      <path d="M92 36 l5 4 -5 4" className="stroke-primary" strokeWidth={2} fill="none" strokeLinecap="round" />
      <rect x={104} y={8} width={50} height={80} rx={3} className="fill-paper stroke-border" strokeWidth={1} />
      <rect x={110} y={15} width={24} height={4.5} rx={2.25} className="fill-primary" />
      <rect x={108} y={37} width={42} height={8} rx={2} className="fill-primary/15" />
      <Lines x={111} y={39} widths={[30]} className="fill-paper-foreground/45" />
      <Lines x={111} y={52} widths={[36, 30, 34, 26]} gap={7} />
    </svg>
  )
}

/** Step 3: the checked page drops into a download tray. */
export function CheckExportIllustration() {
  return (
    <svg viewBox="0 0 160 96" {...svgProps}>
      <rect x={18} y={6} width={52} height={70} rx={3} className="fill-paper stroke-border" strokeWidth={1} />
      <rect x={24} y={13} width={24} height={4.5} rx={2.25} className="fill-primary" />
      <Lines x={24} y={25} widths={[38, 32, 36, 28, 34, 24]} gap={7} />
      <circle cx={66} cy={70} r={11} className="fill-success" />
      <path d="M61 70 l3.4 3.4 6.4 -6.8" className="stroke-success-foreground" strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M114 14 v34" className="stroke-primary" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M104 38 l10 11 10 -11" className="stroke-primary" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M94 60 v14 a4 4 0 0 0 4 4 h32 a4 4 0 0 0 4 -4 v-14" className="stroke-foreground/60" strokeWidth={2.5} fill="none" strokeLinecap="round" />
    </svg>
  )
}
