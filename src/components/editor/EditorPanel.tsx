import type { ComponentType } from 'react'
import { useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { type SectionId } from '@rb/core/types/document'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getPreset } from '@rb/presets/registry'
import { SectionList } from '@/components/editor/SectionList'
import { ContactForm } from '@/components/editor/ContactForm'
import { SummaryForm } from '@/components/editor/SummaryForm'
import { ExperienceForm } from '@/components/editor/ExperienceForm'
import { EducationForm } from '@/components/editor/EducationForm'
import { SkillsForm } from '@/components/editor/SkillsForm'
import { ProjectsForm } from '@/components/editor/ProjectsForm'
import { CertificationsForm } from '@/components/editor/CertificationsForm'
import { VolunteerForm } from '@/components/editor/VolunteerForm'
import { ReferencesForm } from '@/components/editor/ReferencesForm'
import { TailorToJob } from '@/components/ai/TailorToJob'
import { DocumentSettings } from '@/components/editor/DocumentSettings'
import { FormSection } from '@/components/ui/FormSection'
import { Button } from '@/components/ui/Button'

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

export function EditorPanel() {
  const document = useDocumentStore((s) => s.document)
  const showOnboarding = useDocumentStore((s) => s.showOnboarding)
  const dismissOnboarding = useDocumentStore((s) => s.dismissOnboarding)
  const startFromSample = useDocumentStore((s) => s.startFromSample)
  const [showTailor, setShowTailor] = useState(false)

  if (!document) return null

  const hidden = new Set(document.meta.hiddenSections)
  const preset = getPreset(document.meta.presetId)

  return (
    <div className="space-y-5">
      <DocumentSettings />

      <div className="rounded-md border border-border bg-card p-4 shadow-[var(--shadow-raised)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Applying for a specific job?</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Paste the job description and get a tailored summary, keywords to add, and bullet
              suggestions. Nothing changes until you apply it.
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={() => setShowTailor(true)}>
            Tailor to job
          </Button>
        </div>
      </div>

      {showTailor && <TailorToJob onClose={() => setShowTailor(false)} />}

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

      <SectionList />

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
            >
              <Form />
            </FormSection>
          )
        })}
      </div>
    </div>
  )
}
