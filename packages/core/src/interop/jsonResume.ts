/**
 * JSON Resume interop — https://jsonresume.org (schema is MIT).
 *
 * The field's shared vocabulary: 400+ community themes and a stable schema.
 * Supporting it means a Rizzume document can leave and come back, which is the
 * portability guarantee the ecosystem is built around.
 *
 * WHAT IS LOSSY, in both directions — read this before trusting a round trip:
 *
 * Rizzume -> JSON Resume
 *   - `meta` (templateId, themeId, presetId, exportProfile, locale,
 *     sectionOrder, hiddenSections, sectionGuides) has no home in the standard.
 *     It survives a Rizzume->JSON->Rizzume trip only because `toJsonResume`
 *     stashes it under the standard's own free-form `meta` key.
 *   - `contact.headline` maps to `basics.label`.
 *   - `references[].phone` / `.email` are flattened into the standard's single
 *     free-text `reference` field, and cannot be split back out reliably.
 *   - Experience `present: true` becomes an absent `endDate`, which is the
 *     standard's convention.
 *
 * JSON Resume -> Rizzume
 *   - `awards`, `publications`, `interests` have no Rizzume section and are
 *     dropped.
 *   - `basics.image`, `basics.profiles[]` beyond LinkedIn, `location.address`,
 *     `.postalCode`, `.countryCode` are dropped; location collapses to
 *     "city, region".
 *   - `work[].description`, `skills[].level`, `education[].courses`,
 *     `projects[].roles/entity/type/keywords` are dropped.
 *   - `languages` are appended as a skill group, since Rizzume has no language
 *     section.
 */
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ReferenceItem,
  ResumeDocument,
  SkillGroup,
} from '@rb/core/types/document'
import { createId } from '@rb/core/utils'

export interface JsonResumeLocation {
  address?: string
  postalCode?: string
  city?: string
  countryCode?: string
  region?: string
}

export interface JsonResumeProfile {
  network?: string
  username?: string
  url?: string
}

export interface JsonResume {
  $schema?: string
  basics?: {
    name?: string
    label?: string
    image?: string
    email?: string
    phone?: string
    url?: string
    summary?: string
    location?: JsonResumeLocation
    profiles?: JsonResumeProfile[]
  }
  work?: Array<{
    name?: string
    location?: string
    description?: string
    position?: string
    url?: string
    startDate?: string
    endDate?: string
    summary?: string
    highlights?: string[]
  }>
  volunteer?: Array<{
    organization?: string
    position?: string
    url?: string
    startDate?: string
    endDate?: string
    summary?: string
    highlights?: string[]
  }>
  education?: Array<{
    institution?: string
    url?: string
    area?: string
    studyType?: string
    startDate?: string
    endDate?: string
    score?: string
    courses?: string[]
  }>
  certificates?: Array<{ name?: string; date?: string; url?: string; issuer?: string }>
  skills?: Array<{ name?: string; level?: string; keywords?: string[] }>
  languages?: Array<{ language?: string; fluency?: string }>
  projects?: Array<{
    name?: string
    description?: string
    highlights?: string[]
    keywords?: string[]
    startDate?: string
    endDate?: string
    url?: string
    roles?: string[]
    entity?: string
    type?: string
  }>
  references?: Array<{ name?: string; reference?: string }>
  meta?: Record<string, unknown>
}

const SCHEMA_URL =
  'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json'

/** The standard uses ISO-ish dates; Rizzume stores YYYY-MM. Keep what we get. */
function outDate(value: string | undefined, present?: boolean): string | undefined {
  if (present) return undefined
  return value && value.length > 0 ? value : undefined
}

function inDate(value: string | undefined): string {
  if (!value) return ''
  // Accept YYYY, YYYY-MM and YYYY-MM-DD; Rizzume renders from YYYY-MM.
  const match = /^(\d{4})(?:-(\d{2}))?/.exec(value)
  if (!match) return ''
  return match[2] ? `${match[1]}-${match[2]}` : match[1]
}

function locationString(location: JsonResumeLocation | undefined): string | undefined {
  if (!location) return undefined
  const parts = [location.city, location.region].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : undefined
}

function splitLocation(value: string | undefined): JsonResumeLocation | undefined {
  if (!value) return undefined
  const [city, ...rest] = value.split(',').map((part) => part.trim())
  const region = rest.join(', ')
  return region ? { city, region } : { city }
}

// ------------------------------------------------------------------- export

export function toJsonResume(doc: ResumeDocument): JsonResume {
  const { contact } = doc

  const profiles: JsonResumeProfile[] = []
  if (contact.linkedIn) {
    profiles.push({ network: 'LinkedIn', url: contact.linkedIn })
  }

  const skills: JsonResume['skills'] = doc.skills.map((group) => ({
    name: group.name,
    keywords: group.items,
  }))

  return {
    $schema: SCHEMA_URL,
    basics: {
      name: contact.fullName,
      label: contact.headline,
      email: contact.email,
      phone: contact.phone,
      url: contact.website,
      summary: doc.summary || undefined,
      location: splitLocation(contact.location),
      profiles: profiles.length > 0 ? profiles : undefined,
    },
    work: doc.experience.map((role) => ({
      name: role.company,
      position: role.title,
      location: role.location,
      startDate: role.startDate || undefined,
      endDate: outDate(role.endDate, role.present),
      highlights: role.bullets,
    })),
    volunteer: doc.volunteer.map((role) => ({
      organization: role.company,
      position: role.title,
      startDate: role.startDate || undefined,
      endDate: outDate(role.endDate, role.present),
      highlights: role.bullets,
    })),
    education: doc.education.map((edu) => ({
      institution: edu.institution,
      studyType: edu.degree,
      area: edu.field,
      startDate: edu.startDate || undefined,
      endDate: edu.endDate || undefined,
      score: edu.honors,
    })),
    certificates: doc.certifications.map((cert) => ({
      name: cert.name,
      issuer: cert.issuer,
      date: cert.completed,
      url: cert.verifyUrl,
    })),
    skills,
    projects: doc.projects.map((project) => ({
      name: project.name,
      description: project.description,
      url: project.url || undefined,
      highlights: project.bullets,
    })),
    references: doc.references.map((ref) => ({
      name: ref.name,
      reference: [ref.title, ref.company, ref.phone, ref.email].filter(Boolean).join(' · '),
    })),
    // The standard leaves `meta` free-form, which is the only place Rizzume's
    // own settings can ride along without inventing non-standard top-level keys.
    meta: { rizzume: doc.meta },
  }
}

// ------------------------------------------------------------------- import

export interface ImportResult {
  document: ResumeDocument
  /** Fields present in the source that Rizzume has nowhere to put. */
  dropped: string[]
}

/**
 * Merge a JSON Resume into a base document — usually `createEmptyDocument()`,
 * so meta/preset choices come from the app rather than the file.
 */
export function fromJsonResume(source: JsonResume, base: ResumeDocument): ImportResult {
  const dropped: string[] = []
  const basics = source.basics ?? {}

  const linkedIn = (source.basics?.profiles ?? []).find(
    (profile) => (profile.network ?? '').toLowerCase() === 'linkedin',
  )?.url

  const otherProfiles = (source.basics?.profiles ?? []).filter(
    (profile) => (profile.network ?? '').toLowerCase() !== 'linkedin',
  )
  if (otherProfiles.length > 0) dropped.push(`basics.profiles (${otherProfiles.length})`)
  if (basics.image) dropped.push('basics.image')
  if (basics.location?.address) dropped.push('basics.location.address')
  if (basics.location?.postalCode) dropped.push('basics.location.postalCode')
  if (basics.location?.countryCode) dropped.push('basics.location.countryCode')

  const experience: ExperienceItem[] = (source.work ?? []).map((role) => {
    if (role.description) dropped.push('work[].description')
    return {
      id: createId(),
      title: role.position ?? '',
      company: role.name ?? '',
      location: role.location,
      startDate: inDate(role.startDate),
      endDate: inDate(role.endDate),
      present: !role.endDate,
      bullets: [...(role.highlights ?? []), ...(role.summary ? [role.summary] : [])],
    }
  })

  const volunteer: ExperienceItem[] = (source.volunteer ?? []).map((role) => ({
    id: createId(),
    title: role.position ?? '',
    company: role.organization ?? '',
    startDate: inDate(role.startDate),
    endDate: inDate(role.endDate),
    present: !role.endDate,
    bullets: [...(role.highlights ?? []), ...(role.summary ? [role.summary] : [])],
  }))

  const education: EducationItem[] = (source.education ?? []).map((edu) => {
    if (edu.courses?.length) dropped.push('education[].courses')
    return {
      id: createId(),
      institution: edu.institution ?? '',
      degree: edu.studyType ?? '',
      field: edu.area,
      startDate: inDate(edu.startDate),
      endDate: inDate(edu.endDate),
      honors: edu.score,
    }
  })

  const certifications: CertificationItem[] = (source.certificates ?? []).map((cert) => ({
    id: createId(),
    name: cert.name ?? '',
    issuer: cert.issuer ?? '',
    completed: cert.date,
    verifyUrl: cert.url,
  }))

  const skills: SkillGroup[] = (source.skills ?? []).map((group) => {
    if (group.level) dropped.push('skills[].level')
    return {
      id: createId(),
      name: group.name ?? '',
      items: group.keywords ?? [],
    }
  })

  // Rizzume has no language section; a skill group is the honest home for it.
  if (source.languages?.length) {
    skills.push({
      id: createId(),
      name: 'Languages',
      items: source.languages.map((lang) =>
        [lang.language, lang.fluency].filter(Boolean).join(' — '),
      ),
    })
  }

  const projects: ProjectItem[] = (source.projects ?? []).map((project) => {
    if (project.roles?.length) dropped.push('projects[].roles')
    if (project.entity) dropped.push('projects[].entity')
    if (project.keywords?.length) dropped.push('projects[].keywords')
    return {
      id: createId(),
      name: project.name ?? '',
      url: project.url,
      description: project.description,
      bullets: project.highlights ?? [],
    }
  })

  const references: ReferenceItem[] = (source.references ?? []).map((ref) => ({
    id: createId(),
    name: ref.name ?? '',
    // The standard has one free-text field; splitting it back into title and
    // company would be guesswork, so it goes to title verbatim.
    title: ref.reference ?? '',
    company: '',
  }))

  for (const key of ['awards', 'publications', 'interests'] as const) {
    const value = (source as Record<string, unknown>)[key]
    if (Array.isArray(value) && value.length > 0) dropped.push(key)
  }

  // A Rizzume-authored file carries its own meta back; a foreign one does not,
  // and keeps the base document's settings.
  const carried = source.meta?.rizzume as ResumeDocument['meta'] | undefined

  return {
    dropped: [...new Set(dropped)],
    document: {
      ...base,
      meta: carried ? { ...carried, updatedAt: new Date().toISOString() } : base.meta,
      contact: {
        fullName: basics.name ?? '',
        headline: basics.label,
        email: basics.email ?? '',
        phone: basics.phone,
        location: locationString(basics.location),
        linkedIn,
        website: basics.url,
      },
      summary: basics.summary ?? '',
      experience,
      education,
      certifications,
      skills,
      projects,
      volunteer,
      references,
    },
  }
}
