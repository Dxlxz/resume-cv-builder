import type { ComponentType } from 'react'
import { useState } from 'react'
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
import { FormSection } from '@/components/ui/FormSection'
import { Popover } from '@/components/ui/Popover'
import { Button } from '@/components/ui/Button'
import { filledSectionIds } from '@/lib/sectionStatus'

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

function Chevron() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function EditorPanel() {
  const document = useDocumentStore((s) => s.document)
  const showOnboarding = useDocumentStore((s) => s.showOnboarding)
  const dismissOnboarding = useDocumentStore((s) => s.dismissOnboarding)
  const startFromSample = useDocumentStore((s) => s.startFromSample)
  const updateSectionGuide = useDocumentStore((s) => s.updateSectionGuide)
  const [sectionsOpen, setSectionsOpen] = useState(false)

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
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Popover
              ariaLabel="Document settings"
              trigger={
                <Button type="button" variant="secondary" size="sm" className="gap-1.5">
                  Document
                  <Chevron />
                </Button>
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
                <Button type="button" variant="secondary" size="sm" className="gap-1.5">
                  Sections
                  <Chevron />
                </Button>
              }
              className="w-80 max-w-[calc(100vw-2rem)]"
              open={sectionsOpen}
              onOpenChange={setSectionsOpen}
            >
              <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                <SectionListContent onNavigate={() => setSectionsOpen(false)} />
              </div>
            </Popover>
          </div>
        </div>
        <div aria-hidden className="h-0.5 w-full overflow-hidden bg-muted">
          <div
            className="h-full bg-status-success transition-all duration-[var(--duration-state)]"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

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
            >
              <Form />
            </FormSection>
          )
        })}
      </div>
    </div>
  )
}
