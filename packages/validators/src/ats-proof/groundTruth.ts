import type { ResumeDocument } from '@rb/core/types/document'

/**
 * The set of strings a correct PDF must still contain after a parser has
 * extracted its text.
 *
 * Derived from the document itself, so there is no annotation ambiguity: we
 * know exactly what every field should be because we rendered it from this
 * data. (Method after RenderCV's ATS proof, MIT.)
 */
export interface GroundTruth {
  /** Whole strings that must survive extraction verbatim. */
  fields: string[]
  /**
   * Ordered anchors: these must appear in this relative order in the extracted
   * text. This is what catches a multi-column layout interleaving its columns.
   */
  order: string[]
}

/** Long values get split — assert on a distinctive fragment instead. */
function firstWords(text: string, count: number): string {
  return text.trim().split(/\s+/).slice(0, count).join(' ')
}

export function groundTruthFor(doc: ResumeDocument): GroundTruth {
  const fields: string[] = []
  const order: string[] = []

  const { contact } = doc
  fields.push(contact.fullName)
  if (contact.email) fields.push(contact.email)
  if (contact.phone) fields.push(contact.phone)
  if (contact.location) fields.push(contact.location)
  order.push(contact.fullName)

  if (doc.summary.trim()) {
    fields.push(firstWords(doc.summary, 6))
    order.push(firstWords(doc.summary, 6))
  }

  for (const role of doc.experience) {
    fields.push(role.title, role.company)
    order.push(role.title)
    // The first bullet of each role must stay with its role, which is what a
    // date rail or a sidebar could break.
    if (role.bullets[0]) order.push(firstWords(role.bullets[0], 5))
    for (const bullet of role.bullets) fields.push(firstWords(bullet, 5))
  }

  for (const edu of doc.education) {
    fields.push(edu.institution, edu.degree)
    order.push(edu.institution)
  }

  for (const cert of doc.certifications) fields.push(cert.name)
  for (const group of doc.skills) fields.push(...group.items)
  for (const project of doc.projects) fields.push(project.name)

  return { fields, order }
}
