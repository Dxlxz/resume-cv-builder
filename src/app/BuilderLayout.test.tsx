import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { useDocumentStore } from '@/modules/document'
import { BuilderLayout } from './BuilderLayout'

// The preview is an iframe of a generated PDF; this test is about where focus goes.
vi.mock('@/modules/preview', () => ({ PreviewPanel: () => <div /> }))

const setPointer = (coarse: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: coarse && query.includes('pointer: coarse'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

describe('BuilderLayout focus on start', () => {
  beforeEach(() => {
    window.localStorage.clear()
    ;(document.activeElement as HTMLElement | null)?.blur()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('moves focus to the empty Full name field with a fine pointer (AC-4)', async () => {
    setPointer(false)
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    render(<BuilderLayout onHome={() => {}} />)
    await waitFor(() => expect(document.activeElement?.id).toBe('contact-full-name'))
  })

  it('moves focus to the page, not a field, when the draft already has a name (AC-4)', async () => {
    setPointer(false)
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
    render(<BuilderLayout onHome={() => {}} />)
    await waitFor(() => expect(document.activeElement?.id).toBe('main-content'))
  })

  it('does not move focus on a touch device (AC-5)', async () => {
    setPointer(true)
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    render(<BuilderLayout onHome={() => {}} />)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.activeElement).toBe(document.body)
  })
})
