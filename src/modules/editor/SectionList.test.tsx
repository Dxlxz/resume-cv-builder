import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useDocumentStore } from '@/modules/document'
import { SectionListContent } from './SectionList'
import { editorSections } from './editorSections'

const doc = () => useDocumentStore.getState().document!
const order = () => editorSections(doc())

describe('SectionListContent', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
  })

  it('moves a section down with its button, from the keyboard (AC-15)', () => {
    render(<SectionListContent />)
    const before = [...order()]
    const second = before[1]
    const third = before[2]

    // Buttons are reachable and operable by keyboard; Enter/Space on a focused button fires click.
    const down = screen.getAllByRole('button', { name: /^Move .* down$/ })[0]
    down.focus()
    expect(document.activeElement).toBe(down)
    fireEvent.click(down)

    const after = order()
    expect(after[1]).toBe(third)
    expect(after[2]).toBe(second)
    expect(after[0]).toBe('contact')
  })

  it('moves a section up with its button (AC-15)', () => {
    render(<SectionListContent />)
    const before = [...order()]
    const up = screen.getAllByRole('button', { name: /^Move .* up$/ })[1]
    fireEvent.click(up)

    const after = order()
    expect(after[1]).toBe(before[2])
    expect(after[2]).toBe(before[1])
  })

  it('keeps contact first and cannot be moved', () => {
    render(<SectionListContent />)
    expect(screen.queryByRole('button', { name: /Move Contact/ })).toBeNull()
    expect(order()[0]).toBe('contact')
  })

  it('disables moving the first reorderable section up', () => {
    render(<SectionListContent />)
    const firstUp = screen.getAllByRole('button', { name: /^Move .* up$/ })[0]
    expect(firstUp).toBeDisabled()
  })
})
