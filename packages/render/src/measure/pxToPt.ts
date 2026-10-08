const PX_PER_PT = 96 / 72

export function pxToPt(px: number): number {
  return px / PX_PER_PT
}

export function ptToPx(pt: number): number {
  return pt * PX_PER_PT
}
