import type { SectionId } from '@rb/core/types/document'
import { ALL_SECTIONS } from '@rb/core/types/document'

export interface SectionColor {
  fill: string
  border: string
  text: string
}

const TINTS = [
  'var(--color-primary)',
  'var(--color-status-info)',
  'var(--color-status-success)',
  'var(--color-status-warning)',
  'var(--color-status-danger)',
  'var(--color-status-neutral)',
] as const

const FILL_OPACITY = 0.16
const BORDER_OPACITY = 0.45

/**
 * Deterministic, token-derived colour for a section in the layout boxes
 * view. Tints cycle through the semantic palette; sections beyond the
 * first pass use a softer fill so adjacent boxes stay distinguishable.
 * All values reference the UDS semantic tokens - no raw hues.
 */
export function getSectionColor(sectionId: SectionId): SectionColor {
  const index = Math.max(0, ALL_SECTIONS.indexOf(sectionId))
  const tint = TINTS[index % TINTS.length]
  const dim = index >= TINTS.length
  const fillOpacity = dim ? FILL_OPACITY * 0.6 : FILL_OPACITY

  return {
    fill: `color-mix(in oklch, ${tint} ${Math.round(fillOpacity * 100)}%, var(--card))`,
    border: `color-mix(in oklch, ${tint} ${Math.round(BORDER_OPACITY * 100)}%, var(--card))`,
    text: tint,
  }
}

/** Stable 0..5 tint index for a section (legend dots, focus pulse). */
export function sectionColorIndex(sectionId: SectionId): number {
  return Math.max(0, ALL_SECTIONS.indexOf(sectionId)) % TINTS.length
}
