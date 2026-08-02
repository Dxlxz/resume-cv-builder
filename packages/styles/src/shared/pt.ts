/** 1pt = 1/72in; CSS px at 96dpi */
export function ptToPx(pt: number): number {
  return Math.round(pt * (96 / 72) * 100) / 100
}

export function ptCss(pt: number): string {
  return `${pt}pt`
}

export function parsePt(value: string | number | undefined): number | null {
  if (typeof value === 'number') return value
  if (!value) return null
  const match = String(value).match(/^([\d.]+)pt$/)
  return match ? Number(match[1]) : null
}
