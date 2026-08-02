import { describe, expect, it } from 'vitest'
import { generatePdf } from '@/lib/pdf'
import { countPdfPages } from '@/renderers/pdf/countPdfPages'
import {sampleCvDocument, sampleResumeDocument} from '@rb/fixtures'

describe('countPdfPages', () => {
  it('curated resume stays within the 2-page corporate norm', async () => {
    const blob = await generatePdf(sampleResumeDocument)
    const pages = await countPdfPages(blob)
    expect(pages).toBeGreaterThanOrEqual(1)
    expect(pages).toBeLessThanOrEqual(2)
  }, 30000)

  it('complete CV is multi-page', async () => {
    const blob = await generatePdf(sampleCvDocument)
    const pages = await countPdfPages(blob)
    expect(pages).toBeGreaterThanOrEqual(3)
  }, 30000)
})
