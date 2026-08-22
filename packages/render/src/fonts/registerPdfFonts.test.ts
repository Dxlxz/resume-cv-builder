/**
 * @vitest-environment node
 *
 * Node, not the project default jsdom. In test mode registerPdfFonts hands
 * react-pdf a filesystem path (see carlitoSources); under jsdom that path is
 * resolved through a browser code path that corrupts the font bytes, and the
 * embedded subset comes out malformed — pdf.js then reports "Incorrect 'loca'
 * table length" / "Invalid font data in ArrayBuffer" and renders a blank page.
 * That symptom is a test-environment artefact, not a broken font: under node
 * the same file embeds cleanly, and the browser build fetches a real URL.
 * Do not swap the themes back to built-in Helvetica on the strength of it.
 */
import { describe, expect, it } from 'vitest'
import { sampleProfileDocument } from '@rb/fixtures'
import { renderDocumentToPdf } from '@rb/render/renderDocumentToPdf'
import { ensurePdfFontsRegistered } from '@rb/render/fonts/registerPdfFonts'

async function embeddedFonts(blob: Blob): Promise<string[]> {
  const raw = Buffer.from(await blob.arrayBuffer()).toString('latin1')
  const matches = raw.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-,]+)/g)
  return [...new Set([...matches].map((m) => m[1]))]
}

describe('registerPdfFonts', () => {
  it('registers Carlito without error', async () => {
    await expect(ensurePdfFontsRegistered()).resolves.toBeUndefined()
  })

  it('generates navy-corporate PDF using registered Carlito', async () => {
    const blob = await renderDocumentToPdf(sampleProfileDocument)
    expect(blob.size).toBeGreaterThan(1000)
  }, 30000)

  it('embeds Carlito rather than silently falling back to a built-in font', async () => {
    const blob = await renderDocumentToPdf(sampleProfileDocument)
    const fonts = await embeddedFonts(blob)

    // Subset names carry a random six-letter prefix (e.g. XXKEWA+Carlito-Bold).
    expect(fonts.some((f) => f.includes('Carlito'))).toBe(true)
    expect(fonts.some((f) => /^(Helvetica|Times)/.test(f))).toBe(false)
  }, 30000)

  it('embeds Source Serif 4 for the academic CV theme', async () => {
    const cv = {
      ...sampleProfileDocument,
      meta: {
        ...sampleProfileDocument.meta,
        documentType: 'cv' as const,
        templateId: 'academic' as const,
        themeId: 'academic-serif' as const,
      },
    }
    const fonts = await embeddedFonts(await renderDocumentToPdf(cv))

    expect(fonts.some((f) => f.includes('SourceSerif'))).toBe(true)
    expect(fonts.some((f) => /^(Helvetica|Times)/.test(f))).toBe(false)
  }, 30000)
})
