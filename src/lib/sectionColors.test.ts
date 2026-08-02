import { describe, expect, it } from 'vitest'
import { ALL_SECTIONS } from '@rb/core/types/document'
import { getSectionColor, sectionColorIndex } from '@/lib/sectionColors'

describe('sectionColors', () => {
  it('returns the same colour for a section every time', () => {
    for (const section of ALL_SECTIONS) {
      expect(getSectionColor(section)).toEqual(getSectionColor(section))
    }
  })

  it('only references UDS semantic tokens', () => {
    for (const section of ALL_SECTIONS) {
      const color = getSectionColor(section)
      const values = [color.fill, color.border, color.text].join(' ')
      expect(values).toContain('var(--color-')
      expect(values).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(|oklch\(/)
    }
  })

  it('distinguishes every section', () => {
    const colors = ALL_SECTIONS.map((s) => getSectionColor(s))
    const uniqueFills = new Set(colors.map((c) => c.fill))
    expect(uniqueFills.size).toBe(ALL_SECTIONS.length)
  })

  it('keeps the tint index stable and within range', () => {
    for (const section of ALL_SECTIONS) {
      const index = sectionColorIndex(section)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThanOrEqual(5)
      expect(sectionColorIndex(section)).toBe(index)
    }
  })
})
