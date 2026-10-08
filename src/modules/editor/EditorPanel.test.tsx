import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useDocumentStore } from '@/modules/document'
import { scrollToFormSection } from '@/shared/lib/scrollToSection'
import { EditorPanel } from './EditorPanel'
import { editorSections } from './editorSections'

describe('EditorPanel', () => {
  const scrollIntoView = vi.fn()

  beforeEach(() => {
    window.localStorage.clear()
    scrollIntoView.mockClear()
    Element.prototype.scrollIntoView = scrollIntoView
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
  })

  // The nav chips share names with the accordion headers, so address the headers by section id.
  const trigger = (sectionId: string) =>
    window.document.querySelector(`#form-section-${sectionId} [data-slot="accordion-trigger"]`) as HTMLElement

  it('opens Contact and Summary and leaves the other sections collapsed', () => {
    render(<EditorPanel />)
    expect(trigger('contact')).toHaveAttribute('aria-expanded', 'true')
    expect(trigger('summary')).toHaveAttribute('aria-expanded', 'true')
    expect(trigger('experience')).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands a collapsed section and scrolls to it when a jump is requested', async () => {
    render(<EditorPanel />)
    expect(trigger('education')).toHaveAttribute('aria-expanded', 'false')

    act(() => scrollToFormSection('education'))

    await waitFor(() => expect(trigger('education')).toHaveAttribute('aria-expanded', 'true'))
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled())
    const target = scrollIntoView.mock.contexts[0] as HTMLElement
    expect(target.id).toBe('form-section-education')
  })

  it('shows each section status as text for assistive technology, not colour alone', () => {
    render(<EditorPanel />)
    expect(trigger('contact')).toHaveTextContent(/\((complete|not started)\)/)
  })

  it('offers a jump nav with one entry per visible section', () => {
    render(<EditorPanel />)
    const nav = screen.getByRole('navigation', { name: 'Jump to a section' })
    expect(nav.querySelectorAll('[data-scrollspy-anchor]').length).toBeGreaterThanOrEqual(5)
  })

  it('gives every field a unique id and every label exactly one control, with all sections open', async () => {
    render(<EditorPanel />)
    const sections = editorSections(useDocumentStore.getState().document!)
    act(() => {
      for (const id of sections) scrollToFormSection(id)
    })
    for (const id of sections) {
      await waitFor(() => expect(trigger(id)).toHaveAttribute('aria-expanded', 'true'))
    }

    const ids = Array.from(window.document.querySelectorAll('[id]'), (el) => el.id)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect([...new Set(duplicates)]).toEqual([])

    const unresolved = Array.from(window.document.querySelectorAll('label[for]'))
      .filter((l) => window.document.querySelectorAll(`[id="${l.getAttribute('for')}"]`).length !== 1)
      .map((l) => `${l.textContent} -> ${l.getAttribute('for')}`)
    expect(unresolved).toEqual([])
  })

  it('lists nine sections and no Letter for a blank Resume (AC-1)', () => {
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    render(<EditorPanel />)
    expect(screen.getByText('0 of 9 sections done')).toBeInTheDocument()
    expect(window.document.getElementById('form-section-letter')).toBeNull()
  })

  it('keeps the Letter section for a Resume that already holds letter content (AC-2)', () => {
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    useDocumentStore.getState().updateLetter({ paragraphs: ['Dear Ms Rahman,'] })
    render(<EditorPanel />)
    expect(window.document.getElementById('form-section-letter')).not.toBeNull()
    expect(screen.getByText(/of 10 sections done/)).toBeInTheDocument()
  })

  it('shows the first-run guide as one compact block that can be dismissed', () => {
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    render(<EditorPanel />)
    expect(screen.getByRole('region', { name: 'Getting started' })).toBeInTheDocument()
    act(() => screen.getByRole('button', { name: 'Dismiss getting started' }).click())
    expect(screen.queryByRole('region', { name: 'Getting started' })).toBeNull()
  })
})
