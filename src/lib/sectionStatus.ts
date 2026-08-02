import type { ResumeDocument, SectionId } from '@rb/core/types/document'

/**
 * Section completion status for the editor: used for the jump-nav dots and
 * the form header indicators, so progress is visible at a glance.
 */

export function isSectionFilled(document: ResumeDocument, sectionId: SectionId): boolean {
  switch (sectionId) {
    case 'contact': {
      const c = document.contact
      return Boolean(
        c.fullName.trim() || (c.email ?? '').trim() || (c.phone ?? '').trim(),
      )
    }
    case 'summary':
      return document.summary.trim().length > 0
    case 'experience':
      return document.experience.some(
        (e) => e.title.trim() || e.company.trim() || e.bullets.length > 0,
      )
    case 'education':
      return document.education.some((e) => e.institution.trim() || Boolean(e.degree?.trim()))
    case 'certifications':
      return document.certifications.some((c) => c.name.trim())
    case 'skills':
      return document.skills.some((g) => g.items.some((item) => item.trim()))
    case 'projects':
      return document.projects.some((p) => p.name.trim() || p.bullets.length > 0)
    case 'volunteer':
      return document.volunteer.some((v) => v.title.trim() || v.company.trim())
    case 'references':
      return document.references.some((r) => r.name.trim())
  }
}

export function filledSectionIds(
  document: ResumeDocument,
  sections: SectionId[],
): Set<SectionId> {
  const filled = new Set<SectionId>()
  for (const sectionId of sections) {
    if (isSectionFilled(document, sectionId)) filled.add(sectionId)
  }
  return filled
}
