import { beforeEach, describe, expect, it } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useDocumentStore } from '@/modules/document'
import { EditorPanel } from '@/modules/editor'
import { Toolbar } from './Toolbar'

const renderBuilder = () =>
  render(
    <>
      <Toolbar onHome={() => {}} previewVisible onTogglePreview={() => {}} />
      <EditorPanel />
    </>,
  )

const status = () => {
  // A role query over the whole editor is slow; the badge text is enough.
  const match = /ATS Check(\d+ to fix|\d+ ATS risks?|ATS ready)/.exec(document.body.textContent ?? '')
  return match ? (match[1].endsWith('to fix') ? 'Fix before export' : match[1]) : null
}

describe('Toolbar export and live ATS check', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
  })

  it('opens no dialog when export is blocked, and lists what to fix in the editor (AC-6)', async () => {
    renderBuilder()
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/ }))
    await waitFor(() => expect(screen.getByRole('region', { name: 'What to fix before exporting' })).toBeInTheDocument())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByText(/Fix \d things? before exporting/)).toBeInTheDocument()
  })

  it('moves focus to the first invalid field when export is blocked (AC-7)', async () => {
    renderBuilder()
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/ }))
    await waitFor(() => expect(document.activeElement?.id).toBe('contact-full-name'))
  })

  it('shows one message per field in the fix list (AC-8)', async () => {
    renderBuilder()
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/ }))
    const list = await screen.findByRole('region', { name: 'What to fix before exporting' })
    expect(list.querySelectorAll('li')).toHaveLength(2)
  })

  it('updates the ATS badge within a second of fixing a blocking error (AC-9)', async () => {
    renderBuilder()
    await waitFor(() => expect(status()).toBe('Fix before export'), { timeout: 1500 })
    act(() => useDocumentStore.getState().updateContact({ fullName: 'Aisyah Rahman', email: 'aisyah@example.com' }))
    await waitFor(() => expect(status()).not.toBe('Fix before export'), { timeout: 1000 })
  })

  it('ticks fixed items in the fix list instead of dropping them (AC-10)', async () => {
    renderBuilder()
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/ }))
    await screen.findByRole('region', { name: 'What to fix before exporting' })
    act(() => useDocumentStore.getState().updateContact({ fullName: 'Aisyah Rahman', email: 'aisyah@example.com' }))
    await waitFor(() => expect(screen.getByText('Ready to export. Press Export PDF.')).toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getAllByText('(fixed)', { exact: false }).length).toBeGreaterThan(0)
  })

  it('does not show the fix list on a new document after a blocked export (review B1)', async () => {
    renderBuilder()
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/ }))
    await screen.findByRole('region', { name: 'What to fix before exporting' })
    act(() => useDocumentStore.getState().startDocument('resume', 'malaysia-corporate'))
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700))
    })
    expect(screen.queryByRole('region', { name: 'What to fix before exporting' })).toBeNull()
  })
})
