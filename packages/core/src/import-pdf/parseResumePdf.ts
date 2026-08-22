/**
 * Stages 2-4 of PDF import: lines -> sections -> fields -> ResumeDocument.
 *
 * Clean-room; see readPdfText.ts for the licensing note.
 *
 * This is heuristic by nature and will not be right every time. It is built to
 * fail usefully: anything it cannot place goes to `unplacedLines`, and the
 * caller shows the user what was found before anything is replaced. A partial
 * fill that saves ten minutes of typing beats a confident wrong answer.
 */
import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { createId } from '@rb/core/utils'
import { groupIntoLines, readTextItems, type TextLine } from '@rb/core/import-pdf/readPdfText'

export interface ParsedResume {
  document: ResumeDocument
  /** Lines the parser could not attribute to any field. */
  unplacedLines: string[]
  /** Sections it managed to identify. */
  foundSections: SectionId[]
}

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE = /(?:\+?\d[\d\s()-]{7,}\d)/
const URL = /(?:https?:\/\/)?(?:www\.)?[\w-]+\.[a-z]{2,}(?:\/[\w./#?=-]*)?/i
const LINKEDIN = /linkedin\.com\/[\w/-]+/i

/** Month-year or year ranges, incl. an open end. */
const DATE_RANGE =
  /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})\s*[–—-]\s*(present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{4}|\d{4})/i

const BULLET_PREFIX = /^[•·▪◦‣*\-–—]\s*/

/** Headings a resume actually uses, mapped to our sections. */
const SECTION_PATTERNS: Array<{ section: SectionId; pattern: RegExp }> = [
  { section: 'summary', pattern: /^(professional\s+)?(summary|profile|objective|about)$/i },
  { section: 'experience', pattern: /^(work\s+|professional\s+|employment\s+)?(experience|history)$/i },
  { section: 'education', pattern: /^education(\s+&?\s*training)?$/i },
  { section: 'certifications', pattern: /^(certifications?|licen[cs]es?|certificates?)$/i },
  { section: 'skills', pattern: /^(technical\s+)?(skills|competencies|expertise)$/i },
  { section: 'projects', pattern: /^(featured\s+|selected\s+)?projects?$/i },
  { section: 'volunteer', pattern: /^(leadership|volunteer|community|activities)/i },
  { section: 'references', pattern: /^references?$/i },
]

function matchSection(text: string): SectionId | null {
  const cleaned = text.replace(/[:\s]+$/, '').trim()
  if (cleaned.length > 40) return null
  for (const { section, pattern } of SECTION_PATTERNS) {
    if (pattern.test(cleaned)) return section
  }
  return null
}

function monthToken(value: string): string {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  const match = /([a-z]{3})[a-z]*\.?\s*(\d{4})/i.exec(value)
  if (match) {
    const month = months[match[1].toLowerCase()]
    return month ? `${match[2]}-${month}` : match[2]
  }
  const year = /(\d{4})/.exec(value)
  return year ? year[1] : ''
}

interface SectionBlock {
  section: SectionId
  lines: TextLine[]
}

/** Split the ordered lines at each recognised heading. */
function splitIntoSections(lines: TextLine[]): { header: TextLine[]; blocks: SectionBlock[] } {
  const header: TextLine[] = []
  const blocks: SectionBlock[] = []
  let current: SectionBlock | null = null

  for (const line of lines) {
    const section = matchSection(line.text)
    if (section) {
      current = { section, lines: [] }
      blocks.push(current)
      continue
    }
    if (current) current.lines.push(line)
    else header.push(line)
  }

  return { header, blocks }
}

/**
 * Entries inside a section start at a line carrying a date range, or — failing
 * that — a line that is not a bullet. Bullets attach to the entry above them.
 */
function splitEntries(lines: TextLine[]): TextLine[][] {
  const entries: TextLine[][] = []
  let current: TextLine[] = []

  for (const line of lines) {
    const isBullet = BULLET_PREFIX.test(line.text)
    if (!isBullet && current.length > 0 && DATE_RANGE.test(line.text)) {
      entries.push(current)
      current = [line]
      continue
    }
    if (!isBullet && current.length > 2 && !DATE_RANGE.test(current[0].text)) {
      entries.push(current)
      current = [line]
      continue
    }
    current.push(line)
  }
  if (current.length > 0) entries.push(current)
  return entries
}

function bulletsOf(lines: TextLine[]): string[] {
  return lines
    .filter((line) => BULLET_PREFIX.test(line.text))
    .map((line) => line.text.replace(BULLET_PREFIX, '').trim())
    .filter(Boolean)
}

function nonBullets(lines: TextLine[]): string[] {
  return lines
    .filter((line) => !BULLET_PREFIX.test(line.text))
    .map((line) => line.text.trim())
    .filter(Boolean)
}

export function parseLines(lines: TextLine[], base: ResumeDocument): ParsedResume {
  const { header, blocks } = splitIntoSections(lines)
  const unplaced: string[] = []
  const document: ResumeDocument = {
    ...base,
    meta: { ...base.meta, updatedAt: new Date().toISOString() },
    contact: { ...base.contact },
    summary: '',
    experience: [],
    education: [],
    certifications: [],
    skills: [],
    projects: [],
    volunteer: [],
    references: [],
  }

  // ---- header: the name is the first line, contact details follow ----------
  const headerText = header.map((line) => line.text).join(' ')
  if (header.length > 0) {
    // The largest line on the page is almost always the name.
    const biggest = [...header].sort((a, b) => b.height - a.height)[0]
    document.contact.fullName = biggest.text.replace(EMAIL, '').trim()
    const rest = header.filter((line) => line !== biggest)
    const headline = rest.find(
      (line) => !EMAIL.test(line.text) && !PHONE.test(line.text) && !URL.test(line.text),
    )
    if (headline) document.contact.headline = headline.text
  }
  document.contact.email = EMAIL.exec(headerText)?.[0] ?? ''
  const phone = PHONE.exec(headerText.replace(EMAIL, ''))?.[0]
  if (phone) document.contact.phone = phone.trim()
  const linkedIn = LINKEDIN.exec(headerText)?.[0]
  if (linkedIn) document.contact.linkedIn = `https://${linkedIn.replace(/^https?:\/\//, '')}`

  // ---- sections ------------------------------------------------------------
  for (const block of blocks) {
    switch (block.section) {
      case 'summary':
        document.summary = block.lines.map((line) => line.text).join(' ').trim()
        break

      case 'experience':
      case 'volunteer': {
        const target = block.section === 'experience' ? document.experience : document.volunteer
        for (const entry of splitEntries(block.lines)) {
          const heads = nonBullets(entry)
          if (heads.length === 0) continue
          const dateMatch = entry.map((l) => DATE_RANGE.exec(l.text)).find(Boolean)
          const titleLine = heads[0].replace(DATE_RANGE, '').replace(/[|·,]\s*$/, '').trim()
          const present = dateMatch ? /present|current/i.test(dateMatch[2]) : false
          target.push({
            id: createId(),
            title: titleLine,
            company: heads[1]?.replace(DATE_RANGE, '').trim() ?? '',
            startDate: dateMatch ? monthToken(dateMatch[1]) : '',
            endDate: dateMatch && !present ? monthToken(dateMatch[2]) : '',
            present,
            bullets: bulletsOf(entry),
          })
        }
        break
      }

      case 'education':
        for (const entry of splitEntries(block.lines)) {
          const heads = nonBullets(entry)
          if (heads.length === 0) continue
          const dateMatch = entry.map((l) => DATE_RANGE.exec(l.text)).find(Boolean)
          document.education.push({
            id: createId(),
            institution: heads[0].replace(DATE_RANGE, '').trim(),
            degree: heads[1]?.replace(DATE_RANGE, '').trim() ?? '',
            startDate: dateMatch ? monthToken(dateMatch[1]) : '',
            endDate: dateMatch ? monthToken(dateMatch[2]) : '',
            honors: heads.slice(2).join(' ') || undefined,
          })
        }
        break

      case 'certifications':
        for (const text of [...nonBullets(block.lines), ...bulletsOf(block.lines)]) {
          const [name, ...rest] = text.split(/[,–—|]/)
          document.certifications.push({
            id: createId(),
            name: name.trim(),
            issuer: rest.join(', ').trim(),
          })
        }
        break

      case 'skills': {
        // Either "Group: a, b, c" lines, or a flat list.
        for (const text of [...nonBullets(block.lines), ...bulletsOf(block.lines)]) {
          const labelled = /^([^:]{2,40}):\s*(.+)$/.exec(text)
          if (labelled) {
            document.skills.push({
              id: createId(),
              name: labelled[1].trim(),
              items: labelled[2].split(/[,;·]/).map((s) => s.trim()).filter(Boolean),
            })
          } else {
            const items = text.split(/[,;·]/).map((s) => s.trim()).filter(Boolean)
            if (items.length > 0) {
              document.skills.push({ id: createId(), name: '', items })
            }
          }
        }
        break
      }

      case 'projects':
        for (const entry of splitEntries(block.lines)) {
          const heads = nonBullets(entry)
          if (heads.length === 0) continue
          document.projects.push({
            id: createId(),
            name: heads[0].trim(),
            description: heads[1]?.trim(),
            bullets: bulletsOf(entry),
          })
        }
        break

      case 'references':
        for (const text of nonBullets(block.lines)) {
          document.references.push({ id: createId(), name: text.trim(), title: '', company: '' })
        }
        break

      default:
        unplaced.push(...block.lines.map((line) => line.text))
    }
  }

  return {
    document,
    unplacedLines: unplaced,
    foundSections: blocks.map((block) => block.section),
  }
}

export async function parseResumePdf(
  bytes: Uint8Array,
  base: ResumeDocument,
): Promise<ParsedResume> {
  const items = await readTextItems(bytes)
  if (items.length === 0) {
    // No text layer at all — a scan or an image-only export. OCR is out of
    // scope, and guessing would be worse than saying so.
    throw new Error(
      'This PDF has no text layer, so nothing can be read from it. It is probably a scan or an image export.',
    )
  }
  return parseLines(groupIntoLines(items), base)
}
