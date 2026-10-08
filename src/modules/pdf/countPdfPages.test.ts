import { describe, expect, it } from 'vitest'
import { generatePdf } from './generatePdf'
import { countPdfPages } from './countPdfPages'
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

  it('ignores an outline /Count (Typst writes bookmarks with one)', async () => {
    const pdf =
      '%PDF-1.7\n1 0 obj\n<< /Type /Pages /Count 2 /Kids [3 0 R 4 0 R] >>\nendobj\n' +
      '2 0 obj\n<< /Type /Outlines /First 5 0 R /Last 6 0 R /Count 8 >>\nendobj\n'
    expect(await countPdfPages(new Blob([pdf]))).toBe(2)
  })

  it('finds the page tree /Count after a nested dictionary', async () => {
    const pdf = '%PDF-1.7\n1 0 obj\n<< /Type /Pages /Resources << /Font << >> >> /Count 3 /Kids [] >>\nendobj\n'
    expect(await countPdfPages(new Blob([pdf]))).toBe(3)
  })
})