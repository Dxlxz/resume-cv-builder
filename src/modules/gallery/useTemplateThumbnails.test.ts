import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { sampleResumeDocument } from '@rb/fixtures'

const generatePdf = vi.fn(async () => new Blob(['%PDF-1.4']))

vi.mock('@/modules/pdf', () => ({
  generatePdf: (...args: unknown[]) => generatePdf(...(args as [])),
}))

import { clearThumbnailCache, documentInTemplate, useTemplateThumbnails } from './useTemplateThumbnails'

const ids = ['classic', 'ivy', 'split'] as const

describe('useTemplateThumbnails', () => {
  beforeEach(() => {
    generatePdf.mockClear()
    clearThumbnailCache()
  })

  it('makes nothing while the gallery is closed (AC-5)', async () => {
    const { result } = renderHook(() => useTemplateThumbnails(sampleResumeDocument, [...ids], false))
    await new Promise((resolve) => setTimeout(resolve, 30))
    expect(generatePdf).not.toHaveBeenCalled()
    expect(Object.values(result.current).every((s) => s.status === 'loading')).toBe(true)
  })

  it('makes one thumbnail at a time, from the user document (AC-2, AC-6)', async () => {
    let running = 0
    let peak = 0
    generatePdf.mockImplementation(async () => {
      running += 1
      peak = Math.max(peak, running)
      await new Promise((resolve) => setTimeout(resolve, 5))
      running -= 1
      return new Blob(['%PDF-1.4'])
    })
    const { result } = renderHook(() => useTemplateThumbnails(sampleResumeDocument, [...ids], true))
    await waitFor(() => expect(Object.values(result.current).every((s) => s.status === 'ready')).toBe(true))
    expect(generatePdf).toHaveBeenCalledTimes(3)
    expect(peak).toBe(1)
    const used = (generatePdf.mock.calls as unknown as Array<[typeof sampleResumeDocument]>).map(([doc]) => doc.meta.templateId)
    expect(used).toEqual([...ids])
    const first = (generatePdf.mock.calls as unknown as Array<[typeof sampleResumeDocument]>)[0][0]
    expect(first.contact.fullName).toBe(sampleResumeDocument.contact.fullName)
  })

  it('marks a failed template as an error and carries on (AC-7)', async () => {
    generatePdf.mockImplementationOnce(async () => {
      throw new Error('boom')
    })
    const { result } = renderHook(() => useTemplateThumbnails(sampleResumeDocument, [...ids], true))
    await waitFor(() => expect(result.current.ivy.status).toBe('ready'))
    expect(result.current.classic.status).toBe('error')
  })

  it('pairs the Ivy template with the serif theme', () => {
    expect(documentInTemplate(sampleResumeDocument, 'ivy').meta.themeId).toBe('academic-serif')
  })

  it('does not start a template that is already rendering after a close and reopen (AC-6)', async () => {
    let release: (blob: Blob) => void = () => {}
    generatePdf.mockImplementation(() => new Promise<Blob>((resolve) => (release = resolve)))
    const first = renderHook(() => useTemplateThumbnails(sampleResumeDocument, ['classic'], true))
    await waitFor(() => expect(generatePdf).toHaveBeenCalledTimes(1))
    first.unmount()
    const second = renderHook(() => useTemplateThumbnails(sampleResumeDocument, ['classic'], true))
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(generatePdf).toHaveBeenCalledTimes(1)
    release(new Blob(['%PDF-1.4']))
    await waitFor(() => expect(second.result.current.classic.status).toBe('ready'))
  })
})
