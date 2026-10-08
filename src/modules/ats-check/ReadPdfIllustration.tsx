/**
 * The ATS checker's drop area: a page going into the reader, its lines coming out as text (F-009). Decorative,
 * semantic tokens only, so it follows the light and dark themes.
 */
export function ReadPdfIllustration() {
  const line = (x: number, y: number, w: number, cls = 'fill-paper-foreground/20') => (
    <rect x={x} y={y} width={w} height={3.5} rx={1.75} className={cls} />
  )
  return (
    <svg viewBox="0 0 220 96" aria-hidden focusable={false} className="block h-auto w-full max-w-64">
      <g transform="rotate(-6 52 48)">
        <rect x={26} y={10} width={52} height={74} rx={3} className="fill-paper stroke-border" strokeWidth={1} />
        <rect x={32} y={17} width={24} height={4.5} rx={2.25} className="fill-primary" />
        {line(32, 28, 38)}
        {line(32, 35, 32)}
        {line(32, 42, 36)}
        {line(32, 52, 22, 'fill-primary/60')}
        {line(32, 59, 38)}
        {line(32, 66, 30)}
      </g>
      <path d="M92 48 h18" className="stroke-primary" strokeWidth={2} strokeDasharray="3 3" fill="none" />
      <path d="M108 43 l6 5 -6 5" className="stroke-primary" strokeWidth={2} fill="none" strokeLinecap="round" />
      <rect x={124} y={16} width={86} height={64} rx={8} className="fill-background stroke-border" strokeWidth={1} />
      {[28, 40, 52, 64].map((y, i) => (
        <rect key={y} x={134} y={y} width={[62, 48, 56, 40][i]} height={4} rx={2} className="fill-foreground/30" />
      ))}
      <rect x={134 + 40} y={63} width={1.6} height={6} className="fill-primary" />
    </svg>
  )
}
