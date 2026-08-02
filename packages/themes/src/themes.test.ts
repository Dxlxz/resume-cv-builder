import { describe, expect, it } from 'vitest'
import { getTheme, themeForDocument } from '@rb/themes/registry'

describe('themes', () => {
  it('navy-corporate uses Carlito PDF fonts and 10.5pt body', () => {
    const theme = getTheme('navy-corporate')
    expect(theme.typography.bodySize).toBe(10.5)
    expect(theme.fonts.pdfBody).toBe('Carlito')
    expect(theme.fonts.previewBody).toContain('Carlito')
    expect(theme.pdf.bodySize).toBe(10.5)
  })

  it('mono uses serif PDF fonts', () => {
    const theme = getTheme('mono')
    expect(theme.fonts.pdfBody).toBe('Times-Roman')
    expect(theme.pdf.bodyFont).toBe('Times-Roman')
  })

  it('academic-serif uses Times and smaller name', () => {
    const theme = getTheme('academic-serif')
    expect(theme.typography.nameSize).toBe(16)
    expect(theme.fonts.pdfBody).toBe('Times-Roman')
  })

  it('themeForDocument selects academic-serif for CV academic', () => {
    expect(themeForDocument('academic', 'cv', 'navy-corporate')).toBe('academic-serif')
  })

  it('themeForDocument reverts academic-serif when leaving academic template', () => {
    expect(themeForDocument('classic', 'resume', 'academic-serif')).toBe('navy-corporate')
  })
})
