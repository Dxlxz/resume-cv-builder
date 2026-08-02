import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '@/app/store/documentStore'

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
})
