import type { ComponentType } from 'react'
import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { type SectionId } from '@rb/core/types/document'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getPreset } from '@rb/presets/registry'
import { SectionListContent } from './SectionList'
import { DocumentSettingsContent } from './DocumentSettings'
import { TemplateGallery } from '@/modules/gallery'
import { ContactForm } from './forms/ContactForm'
import { SummaryForm } from './forms/SummaryForm'
import { ExperienceForm } from './forms/ExperienceForm'
import { EducationForm } from './forms/EducationForm'
import { SkillsForm } from './forms/SkillsForm'
import { ProjectsForm } from './forms/ProjectsForm'
import { CertificationsForm } from './forms/CertificationsForm'
import { VolunteerForm } from './forms/VolunteerForm'
import { ReferencesForm } from './forms/ReferencesForm'
import { FormSection } from './FormSection'
import { LetterForm } from './forms/LetterForm'
import { filledSectionIds } from './sectionStatus'
import { editorSections } from './editorSections'
import { FirstRunGuide } from './FirstRunGuide'
import { ExportFixList } from './ExportFixList'
import { FOCUS_SECTION_EVENT, scrollToFormSection, type FocusSectionDetail } from '@/shared/lib/scrollToSection'
import { Accordion } from '@/shared/ui/accordion'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { Progress } from '@/shared/ui/progress'
import { Scrollspy } from '@/shared/ui/scrollspy'
import { useConfirm } from '@/shared/ui/use-confirm'

const SECTION_FORMS: Record<SectionId, ComponentType> = {
  contact: ContactForm,
  letter: LetterForm,
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
  letter: 'Recipient, salutation, and body paragraphs',
  summary: '2-4 sentences about your focus',
  experience: 'Roles, dates, and bullet achievements',
  education: 'Degrees and institutions',
  certifications: 'Courses and credentials with issuer and date',
  skills: 'Group by category for clarity',
  projects: 'Portfolio or side projects',
  volunteer: 'Student leadership, conferences, and community roles',
  references: 'Professional referees (usually listed last)',
}

/** Height of the sticky section nav, so a jump leaves the section header clear of it. */
const NAV_OFFSET = 56

export function EditorPanel() {
  const document = useDocumentStore((s) => s.document)
  const showOnboarding = useDocumentStore((s) => s.showOnboarding)
  const dismissOnboarding = useDocumentStore((s) => s.dismissOnboarding)
  const startFromSample = useDocumentStore((s) => s.startFromSample)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const [documentOpen, setDocumentOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const documentButtonRef = useRef<HTMLButtonElement>(null)
  const [openSections, setOpenSections] = useState<string[]>(['contact', 'summary'])
  const scrollRef = useRef<HTMLDivElement>(null)
  const { requestConfirm, confirmDialog } = useConfirm()

  // A jump (from the section list, the nav or the lint panel) opens the section it lands on.
  useEffect(() => {
    const onFocusSection = (event: Event) => {
      const { sectionId } = (event as CustomEvent<FocusSectionDetail>).detail
      setOpenSections((prev) => (prev.includes(sectionId) ? prev : [...prev, sectionId]))
    }
    window.addEventListener(FOCUS_SECTION_EVENT, onFocusSection)
    return () => window.removeEventListener(FOCUS_SECTION_EVENT, onFocusSection)
  }, [])

  if (!document) return null

  const hidden = new Set(document.meta.hiddenSections)
  const preset = getPreset(document.meta.presetId)
  const visibleSections = editorSections(document).filter(
    (sectionId) => sectionId === 'contact' || !hidden.has(sectionId),
  )
  const filled = filledSectionIds(document, visibleSections)
  const done = filled.size
  const total = visibleSections.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div ref={scrollRef} className="relative h-full overflow-x-hidden overflow-y-auto">
      <div className="space-y-4 p-4 lg:p-5">
        <Card size="sm" className="gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3">
            <p className="text-sm font-semibold text-foreground">
              {done} of {total} sections done
            </p>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Popover open={documentOpen} onOpenChange={setDocumentOpen}>
                <PopoverTrigger asChild>
                  <Button ref={documentButtonRef} type="button" variant="outline" size="sm">
                    Document
                    <ChevronDownIcon data-icon="inline-end" aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" aria-label="Document settings" className="w-72 max-w-[calc(100vw-2rem)]">
                  <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                    <DocumentSettingsContent
                      onRequestConfirm={requestConfirm}
                      onBrowseTemplates={() => {
                        setDocumentOpen(false)
                        setGalleryOpen(true)
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
              <Popover open={sectionsOpen} onOpenChange={setSectionsOpen}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    Sections
                    <ChevronDownIcon data-icon="inline-end" aria-hidden />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" aria-label="Sections management" className="w-80 max-w-[calc(100vw-2rem)]">
                  <div className="max-h-[min(24rem,70vh)] overflow-y-auto">
                    <SectionListContent onNavigate={() => setSectionsOpen(false)} />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="px-3">
            <Progress value={progress} aria-label={`${done} of ${total} sections done`} />
          </div>
        </Card>

        <ExportFixList />

        {showOnboarding && (
          <FirstRunGuide
            presetName={preset.name}
            onDismiss={dismissOnboarding}
            onUseSample={() => startFromSample(document.meta.documentType, document.meta.presetId)}
          />
        )}

        <Scrollspy
          key={visibleSections.join(',')}
          targetRef={scrollRef}
          offset={NAV_OFFSET}
          history={false}
          className="sticky top-0 z-10 -mx-4 border-b border-border bg-background px-4 py-2 lg:-mx-5 lg:px-5"
        >
          <nav aria-label="Jump to a section" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visibleSections.map((sectionId) => (
              <Button
                key={sectionId}
                type="button"
                variant="ghost"
                size="sm"
                data-scrollspy-anchor={`form-section-${sectionId}`}
                onClick={() => scrollToFormSection(sectionId)}
                className="shrink-0 text-muted-foreground data-[active=true]:bg-accent data-[active=true]:text-accent-foreground"
              >
                {getSectionLabel(sectionId, preset.labels)}
              </Button>
            ))}
          </nav>
        </Scrollspy>

        <Accordion type="multiple" value={openSections} onValueChange={setOpenSections} className="gap-3">
          {visibleSections.map((sectionId) => {
            const Form = SECTION_FORMS[sectionId]
            return (
              <FormSection
                key={sectionId}
                sectionId={sectionId}
                title={getSectionLabel(sectionId, preset.labels)}
                hint={SECTION_HINTS[sectionId]}
                filled={filled.has(sectionId)}
              >
                <Form />
              </FormSection>
            )
          })}
        </Accordion>
      </div>
      {confirmDialog}
      <TemplateGallery open={galleryOpen} onOpenChange={setGalleryOpen} returnFocusTo={documentButtonRef} />
    </div>
  )
}
