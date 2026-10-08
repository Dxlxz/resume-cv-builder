import type { ResumeDocument } from '@rb/core/types/document'
import type { LintIssue } from '@rb/validators/types'

const NRIC_PATTERN = /\b\d{6}-\d{2}-\d{4}\b/

const PERSONAL_DETAIL_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'marital status', pattern: /\b(marital status|status perkahwinan)\s*(:|\s[-–]\s)/i },
  { label: 'religion', pattern: /\b(religion|agama)\s*(:|\s[-–]\s)/i },
  { label: 'date of birth', pattern: /\b(date of birth|d\.?o\.?b\.?|tarikh lahir)\s*((:|\s[-–]\s)|\d)/i },
  { label: 'age', pattern: /\b(age|umur)\s*(:|\s[-–]\s)\s*\d{2}\b/i },
  // Colon only: "Dragon Boat Race – Champion" is an event, not a personal detail.
  { label: 'race', pattern: /\b(race|bangsa)\s*:/i },
]

function collectText(document: ResumeDocument): string[] {
  const parts = [
    document.contact.fullName,
    document.contact.headline ?? '',
    document.contact.email,
    document.contact.phone ?? '',
    document.contact.location ?? '',
    document.contact.linkedIn ?? '',
    document.contact.website ?? '',
    document.summary,
    ...document.experience.flatMap((e) => [
      e.title,
      e.company,
      e.location ?? '',
      ...e.bullets,
    ]),
    ...document.education.flatMap((e) => [e.institution, e.degree, e.field ?? '', e.honors ?? '']),
    ...document.skills.flatMap((g) => [g.name, ...g.items]),
    ...document.projects.flatMap((p) => [p.name, p.description ?? '', ...p.bullets]),
  ]
  return parts.filter(Boolean)
}

export function runMalaysiaRegionalRules(document: ResumeDocument): LintIssue[] {
  const issues: LintIssue[] = []
  const allText = collectText(document).join(' ')

  if (NRIC_PATTERN.test(allText)) {
    issues.push({
      level: 'warning',
      code: 'IC_NUMBER_DETECTED',
      message: 'Malaysian IC/NRIC pattern detected. Remove it to reduce bias risk.',
      field: 'contact',
    })
  }

  // JobStreet Malaysia advises leaving these out, and employers collect them through their own PDPA-covered forms.
  // Only labelled details count ("Religion: …", "Age - 27"): a colon, or a dash with spaces, so "race-day" or "single-page" never trigger it.
  const personal = PERSONAL_DETAIL_PATTERNS.filter(({ pattern }) => pattern.test(allText)).map(({ label }) => label)
  if (personal.length > 0) {
    issues.push({
      level: 'warning',
      code: 'PERSONAL_DETAILS',
      message: `Remove personal details (${personal.join(', ')}). Malaysian employers ask for them on their own forms, and they invite bias.`,
      section: 'contact',
    })
  }

  if (!document.contact.location?.trim()) {
    issues.push({
      level: 'info',
      code: 'LOCATION_EMPTY',
      message: 'Add city/state (e.g. Petaling Jaya, Selangor) for Malaysia applications.',
      field: 'location',
      section: 'contact',
    })
  }

  return issues
}
