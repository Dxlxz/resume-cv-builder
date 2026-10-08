import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { runValidation } from '@rb/validators/ats-lint'
import { useDocumentStore } from '@/modules/document'
import { LintPanel } from './LintPanel'

const lintNow = () => {
  const { document, setLintIssues } = useDocumentStore.getState()
  setLintIssues(runValidation(document!))
}

describe('LintPanel', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useDocumentStore.getState().startDocument('resume', 'malaysia-corporate')
    lintNow()
  })

  it('separates ATS risks from optional style tips (F-007 AC-9)', () => {
    render(<LintPanel onClose={() => {}} />)
    expect(screen.getByText(/ATS systems do not reject resumes for style/)).toBeInTheDocument()
    expect(screen.queryByText(/out of 100|\/100/)).toBeNull()
  })

  it('lists a fixed issue under Fixed, with a tick (AC-10)', () => {
    render(<LintPanel onClose={() => {}} />)
    expect(screen.queryByText('Fixed')).toBeNull()
    act(() => {
      useDocumentStore.getState().updateContact({ fullName: 'Aisyah Rahman', email: 'aisyah@example.com' })
      lintNow()
    })
    expect(screen.getByText('Fixed')).toBeInTheDocument()
    expect(screen.getAllByText('Fixed:').length).toBeGreaterThan(0)
  })

  it('claims a PDF read-back only when the proof ran for this document (F-007 review)', () => {
    act(() => {
      useDocumentStore.getState().setLintIssues([])
      useDocumentStore.getState().setAtsProofStatus('pending')
    })
    const { unmount } = render(<LintPanel onClose={() => {}} />)
    expect(screen.getByText(/runs when the preview updates/)).toBeInTheDocument()
    expect(screen.queryByText(/reads back in full/)).toBeNull()
    unmount()
    act(() => useDocumentStore.getState().setAtsProofStatus('done'))
    render(<LintPanel onClose={() => {}} />)
    expect(screen.getByText(/reads back in full and in order/)).toBeInTheDocument()
  })
})