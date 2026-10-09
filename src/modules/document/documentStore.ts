import { create } from 'zustand'
import type {
  LetterSection,
  ContactSection,
  DocumentType,
  ExportProfile,
  PresetId,
  ResumeDocument,
  SaveStatus,
  SectionId,
  TemplateId,
  ThemeId,
} from '@rb/core/types/document'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { getPreset } from '@rb/presets/registry'
import { themeForDocument } from '@rb/themes/registry'
import {
  clearStorage,
  discardRecoveredDraft,
  hasRecoverableDraft,
  loadFromStorage,
  loadRecoveredDraft,
} from './storage/persistence'
import type { LintIssue } from '@rb/validators/types'
import type { LayoutPlanResult } from '@rb/layout/types'
import {
  sampleCvDocument,
  sampleInternationalResumeDocument,
  sampleResumeDocument,
} from '@rb/fixtures'


interface DocumentState {
  document: ResumeDocument | null
  hasStarted: boolean
  /** True when a corrupted draft was quarantined and can be restored. */
  recoverableBackup: boolean
  saveStatus: SaveStatus
  saveError: string | null
  exportFieldErrors: Record<string, string>
  pdfError: string | null
  lintIssues: LintIssue[]
  /** Whether the readability proof of the preview PDF ran for the current document (F-007). */
  atsProofStatus: 'pending' | 'done' | 'unavailable'
  setAtsProofStatus: (status: 'pending' | 'done' | 'unavailable') => void
  showLintPanel: boolean
  /** The in-editor list of what blocks export, shown after a blocked export. */
  showFixList: boolean
  showOnboarding: boolean
  previewPageCount: number
  setPreviewPageCount: (count: number) => void
  previewPdfBlob: Blob | null
  /** The document the preview PDF was rendered from; the ATS readability proof compares the two. */
  previewPdfSource: ResumeDocument | null
  setPreviewPdfBlob: (blob: Blob | null, source?: ResumeDocument | null) => void
  layoutPlan: LayoutPlanResult | null
  setLayoutPlan: (plan: LayoutPlanResult | null) => void
  init: () => void
  startDocument: (
    type: DocumentType,
    presetId?: PresetId,
  ) => void
  /** Start from a fictional sample document (same type + preset config). */
  startFromSample: (type: DocumentType, presetId?: PresetId) => void
  /** Adopts a draft from another tab (newer revision won). */
  importExternalDocument: (document: ResumeDocument) => void
  /** Restores the quarantined draft backup into the editor. */
  recoverBackup: () => void
  /** Discards the quarantined backup without restoring it. */
  dismissRecovery: () => void
  applyPreset: (presetId: PresetId) => void
  setDocument: (document: ResumeDocument) => void
  setDocumentType: (type: DocumentType) => void
  setTemplate: (templateId: TemplateId) => void
  setTheme: (themeId: ThemeId) => void
  setExportProfile: (profile: ExportProfile) => void
  updateContact: (contact: ContactSection) => void
  updateSummary: (summary: string) => void
  /** Patch the cover-letter section; creates it on first edit. */
  updateLetter: (patch: Partial<LetterSection>) => void
  updateExperience: (experience: ResumeDocument['experience']) => void
  updateEducation: (education: ResumeDocument['education']) => void
  updateCertifications: (certifications: ResumeDocument['certifications']) => void
  updateSkills: (skills: ResumeDocument['skills']) => void
  updateProjects: (projects: ResumeDocument['projects']) => void
  updateVolunteer: (volunteer: ResumeDocument['volunteer']) => void
  updateReferences: (references: ResumeDocument['references']) => void
  reorderSections: (order: SectionId[]) => void
  toggleSection: (sectionId: SectionId) => void
  setSaveStatus: (status: SaveStatus, error?: string | null) => void
  setExportFieldErrors: (errors: Record<string, string>) => void
  setPdfError: (error: string | null) => void
  setLintIssues: (issues: LintIssue[]) => void
  setShowLintPanel: (show: boolean) => void
  setShowFixList: (show: boolean) => void
  dismissOnboarding: () => void
  reset: () => void
}

function touchMeta(doc: ResumeDocument): ResumeDocument {
  return {
    ...doc,
    meta: { ...doc.meta, updatedAt: new Date().toISOString() },
  }
}

function applyPresetToDocument(
  doc: ResumeDocument,
  presetId: PresetId,
  preserveContent = true,
): ResumeDocument {
  const preset = getPreset(presetId)
  const d = preset.defaults
  return touchMeta({
    ...(preserveContent ? doc : createEmptyDocument(d.documentType, presetId)),
    meta: {
      ...doc.meta,
      schemaVersion: 3,
      presetId,
      templateId: d.templateId,
      themeId: d.themeId,
      pageSize: d.pageSize,
      exportProfile: d.exportProfile,
      locale: d.locale,
      sectionOrder: d.sectionOrder ?? doc.meta.sectionOrder,
      documentType: preserveContent ? doc.meta.documentType : d.documentType,
    },
  })
}

export const useDocumentStore = create<DocumentState>((set, get) => {
  /** Once the user starts typing, the onboarding banner has done its job. */
  const dismissOnboardingIfOpen = () => {
    if (get().showOnboarding) set({ showOnboarding: false })
  }

  return {
    document: null,
    hasStarted: false,
    recoverableBackup: false,
    saveStatus: 'saved',
    saveError: null,
    exportFieldErrors: {},
    pdfError: null,
    lintIssues: [],
    showLintPanel: false,
    showFixList: false,
    showOnboarding: true,
    previewPageCount: 1,
    previewPdfBlob: null,
    previewPdfSource: null,
    atsProofStatus: 'pending',
    layoutPlan: null,
  
  setPreviewPageCount: (count) => set({ previewPageCount: count }),
  setPreviewPdfBlob: (blob, source = null) => set({ previewPdfBlob: blob, previewPdfSource: source }),
  setLayoutPlan: (plan) => set({ layoutPlan: plan }),

  init: () => {
    const saved = loadFromStorage()
    if (saved) {
      set({
        document: saved,
        hasStarted: true,
        showOnboarding: false,
        saveStatus: 'saved',
      })
    } else if (hasRecoverableDraft()) {
      set({ recoverableBackup: true })
    }
  },

  importExternalDocument: (document) => {
    // From another tab. The incoming revision is newer by construction
    // (draftPersistence only fires when updatedAt wins), so adopt as-is.
    set({
      document,
      hasStarted: true,
      showOnboarding: false,
      recoverableBackup: false,
      saveStatus: 'saved',
      exportFieldErrors: {},
      pdfError: null,
      lintIssues: [],
      showLintPanel: false,
      showFixList: false,
    })
  },

  recoverBackup: () => {
    const recovered = loadRecoveredDraft()
    if (!recovered) {
      set({ recoverableBackup: false })
      return
    }
    discardRecoveredDraft()
    set({
      document: recovered,
      hasStarted: true,
      showOnboarding: false,
      recoverableBackup: false,
      saveStatus: 'saved',
      exportFieldErrors: {},
      pdfError: null,
      lintIssues: [],
      showLintPanel: false,
      showFixList: false,
    })
  },

  dismissRecovery: () => {
    discardRecoveredDraft()
    set({ recoverableBackup: false })
  },

  startDocument: (type, presetId = 'international-generic') => {
    set({
      document: createEmptyDocument(type, presetId),
      hasStarted: true,
      showOnboarding: true,
      saveStatus: 'saved',
      exportFieldErrors: {},
      pdfError: null,
      lintIssues: [],
      showLintPanel: false,
      showFixList: false,
    })
  },

  startFromSample: (type, presetId = 'malaysia-corporate') => {
    const isIntl = presetId === 'international-generic'
    const base =
      type === 'cv'
        ? sampleCvDocument
        : isIntl
          ? sampleInternationalResumeDocument
          : sampleResumeDocument
    set({
      document: applyPresetToDocument(base, presetId, true),
      hasStarted: true,
      showOnboarding: false,
      saveStatus: 'saved',
      exportFieldErrors: {},
      pdfError: null,
      lintIssues: [],
      showLintPanel: false,
      showFixList: false,
    })
  },


  applyPreset: (presetId) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({
      document: applyPresetToDocument(current, presetId, true),
      showOnboarding: true,
      lintIssues: [],
    })
  },

  setDocument: (document) => {
    set({ document: touchMeta(document), exportFieldErrors: {}, pdfError: null, lintIssues: [] })
  },


  setDocumentType: (type) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    const preset = getPreset(current.meta.presetId)
    const isIntl = current.meta.presetId === 'international-generic'
    const templateId = isIntl
      ? type === 'resume'
        ? 'classic'
        : 'academic'
      : preset.defaults.templateId
    set({
      document: touchMeta({
        ...current,
        meta: {
          ...current.meta,
          documentType: type,
          templateId,
          themeId: themeForDocument(templateId, type, current.meta.themeId),
          pageSize: isIntl
            ? type === 'resume'
              ? 'letter'
              : 'a4'
            : preset.defaults.pageSize,
        },
      }),
    })
  },

  setTemplate: (templateId) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({
      document: touchMeta({
        ...current,
        meta: {
          ...current.meta,
          templateId,
          themeId: themeForDocument(
            templateId,
            current.meta.documentType,
            current.meta.themeId,
          ),
        },
      }),
    })
  },

  setTheme: (themeId) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({
      document: touchMeta({
        ...current,
        meta: { ...current.meta, themeId },
      }),
    })
  },

  setExportProfile: (exportProfile) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({
      document: touchMeta({
        ...current,
        meta: { ...current.meta, exportProfile },
      }),
    })
  },

  updateContact: (contact) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({
      document: touchMeta({ ...current, contact }),
      exportFieldErrors: {},
    })
  },

  updateLetter: (patch) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({
      document: touchMeta({
        ...current,
        letter: { paragraphs: [], ...current.letter, ...patch },
      }),
    })
  },

  updateSummary: (summary) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, summary }) })
  },

  updateExperience: (experience) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, experience }) })
  },

  updateEducation: (education) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, education }) })
  },

  updateCertifications: (certifications) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, certifications }) })
  },

  updateSkills: (skills) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, skills }) })
  },

  updateProjects: (projects) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, projects }) })
  },

  updateVolunteer: (volunteer) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, volunteer }) })
  },

  updateReferences: (references) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({ document: touchMeta({ ...current, references }) })
  },

  reorderSections: (order) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current) return
    set({
      document: touchMeta({
        ...current,
        meta: { ...current.meta, sectionOrder: order },
      }),
    })
  },

  toggleSection: (sectionId) => {
    dismissOnboardingIfOpen()
    const current = get().document
    if (!current || sectionId === 'contact') return
    const hidden = new Set(current.meta.hiddenSections)
    if (hidden.has(sectionId)) hidden.delete(sectionId)
    else hidden.add(sectionId)
    set({
      document: touchMeta({
        ...current,
        meta: { ...current.meta, hiddenSections: [...hidden] },
      }),
    })
  },

  setSaveStatus: (status, error = null) => {
    set({ saveStatus: status, saveError: error })
  },

  setExportFieldErrors: (errors) => set({ exportFieldErrors: errors }),

  setPdfError: (error) => set({ pdfError: error }),

  setLintIssues: (issues) => set({ lintIssues: issues }),
  setAtsProofStatus: (atsProofStatus) => set({ atsProofStatus }),

  setShowLintPanel: (show) => set({ showLintPanel: show }),

  setShowFixList: (show) => set({ showFixList: show }),

  dismissOnboarding: () => set({ showOnboarding: false }),

  reset: () => {
    clearStorage()
    set({
      document: null,
      hasStarted: false,
      saveStatus: 'saved',
      saveError: null,
      recoverableBackup: false,
      exportFieldErrors: {},
      pdfError: null,
      lintIssues: [],
      showLintPanel: false,
      showFixList: false,
      showOnboarding: true,
    })
  },
  }
})
