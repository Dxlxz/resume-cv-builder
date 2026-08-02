import type { ResumeDocument } from '@rb/core/types/document'
import type { LintIssue } from '@rb/validators/types'

const NRIC_PATTERN = /\b\d{6}-\d{2}-\d{4}\b/

function collectText(document: ResumeDocument): string[] {
  const parts = [
    document.contact.fullName,
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
