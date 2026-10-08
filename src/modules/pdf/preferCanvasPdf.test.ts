import { afterEach, describe, expect, it } from 'vitest'
import { preferCanvasPdf } from './preferCanvasPdf'

const viewer = (enabled: boolean | undefined) =>
  Object.defineProperty(navigator, 'pdfViewerEnabled', { value: enabled, configurable: true })

describe('preferCanvasPdf', () => {
  afterEach(() => {
    viewer(undefined)
    window.history.pushState({}, '', '/')
  })

  it('draws on canvas by default, desktop included', () => {
    viewer(true)
    expect(preferCanvasPdf()).toBe(true)
  })
  it('uses the browser viewer when the address asks for it', () => {
    viewer(true)
    window.history.pushState({}, '', '/?pdf=native')
    expect(preferCanvasPdf()).toBe(false)
  })
  it('stays on canvas when asked for the browser viewer but there is none', () => {
    viewer(false)
    window.history.pushState({}, '', '/?pdf=native')
    expect(preferCanvasPdf()).toBe(true)
  })
})
