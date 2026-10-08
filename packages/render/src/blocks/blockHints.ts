import { getBlockHint } from '@rb/layout/pdfLayoutContext'

export function pdfWrapHint(
  blockId: string,
  fallback?: boolean,
): boolean | undefined {
  const hint = getBlockHint(blockId)
  if (hint?.wrap === false) return false
  return fallback
}

export function pdfMinPresenceHint(blockId: string, fallback: number): number {
  return getBlockHint(blockId)?.minPresenceAhead ?? fallback
}

export function pdfBreakHint(blockId: string): boolean | undefined {
  return getBlockHint(blockId)?.breakBefore ? true : undefined
}
