import { afterEach, describe, expect, it, vi } from 'vitest'
import { pdfEngine } from './pdfEngine'

afterEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

describe('pdfEngine', () => {
  it('defaults to Typst', () => {
    expect(pdfEngine()).toBe('typst')
  })

  it('remembers an opt-out to react-pdf, and switching back', () => {
    window.history.replaceState(null, '', '/builder?engine=react-pdf')
    expect(pdfEngine()).toBe('react-pdf')
    window.history.replaceState(null, '', '/builder')
    expect(pdfEngine()).toBe('react-pdf')
    window.history.replaceState(null, '', '/builder?engine=typst')
    expect(pdfEngine()).toBe('typst')
  })

  it('falls back to Typst when storage is blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(pdfEngine()).toBe('typst')
    spy.mockRestore()
  })
})
