import { describe, expect, it } from 'vitest'
import { generatePdf } from '@/lib/pdf'
import { sampleResume, sampleMalaysiaResume, sampleCv } from '@rb/fixtures'

describe('generatePdf', () => {
  it('generates a non-empty PDF for sample resume', async () => {
    const blob = await generatePdf(sampleResume)
    expect(blob.size).toBeGreaterThan(0)
    expect(blob.type).toContain('pdf')
  }, 15000)

  it('generates PDF for Malaysia ATS-strict sample', async () => {
    const blob = await generatePdf(sampleMalaysiaResume)
    expect(blob.size).toBeGreaterThan(0)
  }, 15000)

  it('generates a non-empty PDF for sample CV', async () => {
    const blob = await generatePdf(sampleCv)
    expect(blob.size).toBeGreaterThan(0)
  }, 15000)
})
