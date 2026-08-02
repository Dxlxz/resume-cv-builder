import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '@/app/store/documentStore'
import { RECOVERY_KEY } from '@/lib/persistence'
import { sampleResumeDocument } from '@rb/fixtures'

describe('document store onboarding', () => {
  beforeEach(() => {
    useDocumentStore.getState().reset()
  })

  it('starts from a Malaysia sample with preset config applied', () => {
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
    const state = useDocumentStore.getState()
    expect(state.hasStarted).toBe(true)
    expect(state.showOnboarding).toBe(false)
    expect(state.document?.contact.fullName).toBe('Jordan Tan Wei Ming')
    expect(state.document?.meta.presetId).toBe('malaysia-corporate')
    expect(state.document?.meta.documentType).toBe('resume')
    expect(state.document?.experience.length).toBeGreaterThan(0)
  })

  it('starts from the international sample when that preset is chosen', () => {
    useDocumentStore.getState().startFromSample('resume', 'international-generic')
    const doc = useDocumentStore.getState().document
    expect(doc?.contact.fullName).toBe('Alex Morgan')
    expect(doc?.meta.presetId).toBe('international-generic')
  })

  it('starts a CV sample with cv document type', () => {
    useDocumentStore.getState().startFromSample('cv', 'malaysia-corporate')
    const doc = useDocumentStore.getState().document
    expect(doc?.meta.documentType).toBe('cv')
    expect(doc?.experience.length).toBeGreaterThanOrEqual(2)
  })

  it('auto-dismisses onboarding on the first edit', () => {
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')
    useDocumentStore.setState({ showOnboarding: true })
    const { document } = useDocumentStore.getState()
    useDocumentStore
      .getState()
      .updateContact({ ...document!.contact, fullName: 'Someone Else' })
    expect(useDocumentStore.getState().showOnboarding).toBe(false)
  })

  it('imports an external document from another tab', () => {
    useDocumentStore.getState().importExternalDocument(sampleResumeDocument)
    const state = useDocumentStore.getState()
    expect(state.document?.contact.fullName).toBe('Jordan Tan Wei Ming')
    expect(state.hasStarted).toBe(true)
    expect(state.showOnboarding).toBe(false)
    expect(state.saveStatus).toBe('saved')
  })

  it('restores a quarantined draft backup', () => {
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(sampleResumeDocument))
    useDocumentStore.setState({ recoverableBackup: true })

    useDocumentStore.getState().recoverBackup()

    const state = useDocumentStore.getState()
    expect(state.document?.contact.fullName).toBe('Jordan Tan Wei Ming')
    expect(state.hasStarted).toBe(true)
    expect(state.recoverableBackup).toBe(false)
    expect(localStorage.getItem(RECOVERY_KEY)).toBeNull()
  })

  it('dismisses the recovery without restoring the backup', () => {
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(sampleResumeDocument))
    useDocumentStore.setState({ recoverableBackup: true })

    useDocumentStore.getState().dismissRecovery()

    const state = useDocumentStore.getState()
    expect(state.document).toBeNull()
    expect(state.recoverableBackup).toBe(false)
    expect(localStorage.getItem(RECOVERY_KEY)).toBeNull()
  })

  it('sets and clears a section guide', () => {
    useDocumentStore.getState().startFromSample('resume', 'malaysia-corporate')

    useDocumentStore.getState().updateSectionGuide('summary', 'British English, 2-4 sentences.')
    expect(useDocumentStore.getState().document?.meta.sectionGuides.summary).toBe(
      'British English, 2-4 sentences.',
    )

    useDocumentStore.getState().updateSectionGuide('summary', '   ')
    expect(useDocumentStore.getState().document?.meta.sectionGuides.summary).toBeUndefined()
  })
})
