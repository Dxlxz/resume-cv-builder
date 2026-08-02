import type { ComponentType } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { type SectionId } from '@rb/core/types/document'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getPreset } from '@rb/presets/registry'
import { SectionListContent } from '@/components/editor/SectionList'
import { DocumentSettingsContent } from '@/components/editor/DocumentSettings'
import { ContactForm } from '@/components/editor/ContactForm'
import { SummaryForm } from '@/components/editor/SummaryForm'
import { ExperienceForm } from '@/components/editor/ExperienceForm'
import { EducationForm } from '@/components/editor/EducationForm'
import { SkillsForm } from '@/components/editor/SkillsForm'
import { ProjectsForm } from '@/components/editor/ProjectsForm'
import { CertificationsForm } from '@/components/editor/CertificationsForm'
import { VolunteerForm } from '@/components/editor/VolunteerForm'
import { ReferencesForm } from '@/components/editor/ReferencesForm'
import { IdrizzIconButton } from '@/components/ai/IdrizzIconButton'
import { FormSection } from '@/components/ui/FormSection'
import { Popover } from '@/components/ui/Popover'
import { Tooltip } from '@/components/ui/Tooltip'
import { Button } from '@/components/ui/Button'
import { filledSectionIds } from '@/lib/sectionStatus'
import { scrollToFormSection } from '@/lib/scrollToSection'

const SECTION_FORMS: Record<SectionId, ComponentType> = {
  contact: ContactForm,
  summary: SummaryForm,
  experience: ExperienceForm,
  education: EducationForm,
  certifications: CertificationsForm,
  skills: SkillsForm,
  projects: ProjectsForm,
  volunteer: VolunteerForm,
  references: ReferencesForm,
}

const SECTION_HINTS: Partial<Record<SectionId, string>> = {
  contact: 'Name, email, and links',
  summary: '2-4 sentences about your focus',
  experience: 'Roles, dates, and bullet achievements',
  education: 'Degrees and institutions',
  certifications: 'Courses and credentials with issuer and date',
  skills: 'Group by category for clarity',
  projects: 'Portfolio or side projects',
  volunteer: 'Student leadership, conferences, and community roles',
  references: 'Professional referees (usually listed last)',
}

const SECTION_AI_HINTS: Partial<Record<SectionId, string>> = {
  summary: 'Rewrite the professional summary to be tighter and more persuasive.',
  experience: 'Improve the bullet points for every role: stronger verbs, measurable outcomes, no invented facts.',
  education: 'Improve my education entries.',
  skills: 'Add or reorganise my skill groups so they match my experience.',
  certifications: 'Improve my certifications section.',
  projects: 'Improve my projects section.',
  volunteer: 'Improve my volunteer and leadership section.',
  references: 'Improve my references section.',
  contact: 'Review my contact section for anything missing.',
}

interface EditorPanelProps {
  /** Opens the floating Idrizz chat with a prefilled instruction. */
  onAskIdrizz: (instruction: string) => void
}

export function EditorPanel({ onAskIdrizz }: EditorPanelProps) {
  const document = useDocumentStore((s) => s.document)
  const showOnboarding = useDocumentStore((s) => s.showOnboarding)
  const dismissOnboarding = useDocumentStore((s) => s.dismissOnboarding)
  const startFromSample = useDocumentStore((s) => s.startFromSample)
  const updateSectionGuide = useDocumentStore((s) => s.updateSectionGuide)

  if (!document) return null

  const hidden = new Set(document.meta.hiddenSections)
  const preset = getPreset(document.meta.presetId)
  const visibleSections = document.meta.sectionOrder.filter(
    (sectionId) => sectionId === 'contact' || !hidden.has(sectionId),
  )
  const filled = filledSectionIds(document, visibleSections)
  const done = filled.size
  const total = visibleSections.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-5">
      <div className="rounded-md border border-border bg-card shadow-[var(--shadow-raised)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden
              className={`h-2 w-2 shrink-0 rounded-full ${
                done === total ? 'bg-status-success' : 'bg-status-warning'
              }`}
            />
            <p className="truncate text-sm font-semibold text-foreground">
              {done} of {total} sections done
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <Popover
                ariaLabel="Document settings"
                trigger={
                  <Tooltip label="Document settings">
                    <button
                      type="button"
                      aria-label="Document settings"
                      className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted hover:text-foreground"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </button>
                  </Tooltip>
                }
                className="w-72 max-w-[calc(100vw-2rem)]"
              >
                <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                  <DocumentSettingsContent />
                </div>
              </Popover>
              <Popover
                ariaLabel="Sections management"
                trigger={
                  <Tooltip label="Sections - reorder and hide">
                    <button
                      type="button"
                      aria-label="Sections - reorder and hide"
                      className="flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted hover:text-foreground"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </Tooltip>
                }
                className="w-80 max-w-[calc(100vw-2rem)]"
              >
                <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                  <SectionListContent />
                </div>
              </Popover>
            </div>
          </div>
        </div>
        <div aria-hidden className="h-0.5 w-full overflow-hidden bg-muted">
          <div
            className="h-full bg-status-success transition-all duration-[var(--duration-state)]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="sticky top-0 z-10 -mx-4 flex items-center gap-1.5 overflow-x-auto border-b border-border bg-sidebar px-4 py-2 lg:-mx-5 lg:px-5"
      >
        {visibleSections.map((sectionId) => {
          const label = getSectionLabel(sectionId, preset.labels)
          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => scrollToFormSection(sectionId)}
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs transition-colors duration-[var(--duration-state)] ${
                filled.has(sectionId)
                  ? 'border-border bg-card text-foreground hover:border-foreground/30'
                  : 'border-border/60 bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  filled.has(sectionId) ? 'bg-status-success' : 'bg-foreground/20'
                }`}
              />
              {label}
            </button>
          )
        })}
      </nav>

      {showOnboarding && (
        <div className="rounded-md border border-status-info/30 bg-badge-info p-4 text-sm text-status-info-foreground">
          <p className="font-semibold">Welcome to {preset.name}</p>
          <p className="mt-1 text-status-info-foreground/90">
            Three quick steps to an ATS-ready document:
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>
              Fill in your details. The preview on the right updates as you type.
            </li>
            <li>Add sections you need (skills, projects, references) from the section list.</li>
            <li>Run the ATS check in the toolbar, then export your PDF.</li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                startFromSample(document.meta.documentType, document.meta.presetId)
              }
            >
              Start from a sample instead
            </Button>
            <Button type="button" onClick={dismissOnboarding}>
              Got it
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {document.meta.sectionOrder.map((sectionId) => {
          if (sectionId !== 'contact' && hidden.has(sectionId)) return null
          const Form = SECTION_FORMS[sectionId]
          return (
            <FormSection
              key={sectionId}
              sectionId={sectionId}
              title={getSectionLabel(sectionId, preset.labels)}
              hint={SECTION_HINTS[sectionId]}
              defaultOpen={sectionId === 'contact' || sectionId === 'summary'}
              filled={filled.has(sectionId)}
              guide={document.meta.sectionGuides[sectionId]}
              onGuideChange={(text) => updateSectionGuide(sectionId, text)}
              action={
                <IdrizzIconButton
                  label={`Ask Idrizz about ${getSectionLabel(sectionId, preset.labels)}`}
                  onClick={() => onAskIdrizz(SECTION_AI_HINTS[sectionId] ?? '')}
                />
              }
            >
              <Form />
            </FormSection>
          )
        })}
      </div>
    </div>
  )
}
