import { describe, expect, it } from 'vitest'
import { contrastRatio, meetsContrastAA } from '@rb/styles/shared/contrast'

describe('contrast', () => {
  it('passes WCAG AA for navy corporate accent on white', () => {
    expect(meetsContrastAA('#1F3864', '#ffffff')).toBe(true)
    const ratio = contrastRatio('#1F3864', '#ffffff')
    expect(ratio).not.toBeNull()
    expect(ratio!).toBeGreaterThanOrEqual(4.5)
  })

  it('fails WCAG AA for low-contrast pastel on white', () => {
    expect(meetsContrastAA('#cccccc', '#ffffff')).toBe(false)
  })
})
