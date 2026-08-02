import { describe, expect, it } from 'vitest'
import {sampleProfileDocument} from '@rb/fixtures'
import { renderDocumentToPdf } from '@rb/render/renderDocumentToPdf'
import { ensurePdfFontsRegistered } from '@rb/render/fonts/registerPdfFonts'

describe('registerPdfFonts', () => {
  it('registers Carlito without error', async () => {
    await expect(ensurePdfFontsRegistered()).resolves.toBeUndefined()
  })

  it('generates navy-corporate PDF using registered Carlito', async () => {
    const blob = await renderDocumentToPdf(sampleProfileDocument)
    expect(blob.size).toBeGreaterThan(1000)
  }, 30000)
})
