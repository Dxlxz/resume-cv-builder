import type { ComponentType } from 'react'
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
  summary: '2–4 sentences about your focus',
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

  if (!document) return null

  const hidden = new Set(document.meta.hiddenSections)
  const preset = getPreset(document.meta.presetId)

  return (
    <div className="space-y-5">
      {showOnboarding && (
        <div className="rounded-md border border-status-info/30 bg-badge-info p-4 text-sm text-status-info-foreground">
          <p className="font-semibold">Welcome — {preset.name}</p>
          <p className="mt-1 text-status-info-foreground/90">
            Fill in each section below. Your preview updates on the right as you type.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {preset.hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
            <li>
              Customize skill lists and job titles in{' '}
              <a href="#/admin" className="font-medium text-primary underline">
                Manage catalogs
              </a>
              .
            </li>
          </ul>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            onClick={dismissOnboarding}
          >
            Got it
          </Button>
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
