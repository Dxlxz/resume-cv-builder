/**
 * The engine behind the public ATS checker: what does a parser see in *this*
 * PDF? Works on any file, not just ours, so there is no ground truth to
 * compare against — the checks are all things that are wrong on their own
 * terms.
 */
import { extractPdfText } from '@rb/validators/ats-proof/extractPdfText'
import { groupIntoLines, readTextItems } from '@rb/core/import-pdf/readPdfText'

export type AtsSeverity = 'critical' | 'warning' | 'ok'

export interface AtsCheck {
  id: string
  label: string
  severity: AtsSeverity
  detail: string
}

export interface AtsReport {
  pageCount: number
  wordCount: number
  checks: AtsCheck[]
  /** What the parser actually read, for the user to eyeball. */
  extractedText: string
  detectedSections: string[]
}

const SECTION_WORDS = [
  'summary', 'profile', 'objective',
  'experience', 'employment', 'history',
  'education',
  'skills', 'competencies',
  'projects',
  'certifications', 'certificates', 'licenses',
  'references',
  'awards', 'publications', 'volunteer', 'leadership',
]

const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE = /(?:\+?\d[\d\s()-]{7,}\d)/
const HYPHEN_SPLIT = /[A-Za-z]{2,}- [a-z]{2,}/

export async function checkAnyPdf(bytes: Uint8Array): Promise<AtsReport> {
  // Extract twice, deliberately: the flat text layer is what a naive parser
  // reads, while the positioned items show whether the reading order that
  // layer implies matches the visual one.
  const flat = await extractPdfText(bytes.slice())
  const items = await readTextItems(bytes.slice())
  const lines = groupIntoLines(items)

  const text = flat.text
  const words = text.split(/\s+/).filter(Boolean)
  const checks: AtsCheck[] = []

  const push = (id: string, label: string, severity: AtsSeverity, detail: string) =>
    checks.push({ id, label, severity, detail })

  // 1. Is there a text layer at all? Everything else depends on this.
  if (words.length === 0) {
    push(
      'text-layer',
      'Readable text',
      'critical',
      'No text could be extracted. This is almost certainly a scan or an image export, and most parsers will read nothing at all.',
    )
    return { pageCount: flat.pageCount, wordCount: 0, checks, extractedText: '', detectedSections: [] }
  }
  push('text-layer', 'Readable text', 'ok', `${words.length} words extracted across ${flat.pageCount} page(s).`)

  const emptyPages = flat.pages.filter((page) => page.trim().length === 0).length
  if (emptyPages > 0) {
    push('empty-pages', 'Every page readable', 'critical', `${emptyPages} page(s) have no text layer.`)
  } else {
    push('empty-pages', 'Every page readable', 'ok', 'All pages carry extractable text.')
  }

  // 2. Contact details must be in the body, not a header/footer region that
  // some parsers skip entirely.
  if (EMAIL.test(text)) {
    push('email', 'Email found', 'ok', EMAIL.exec(text)?.[0] ?? '')
  } else {
    push('email', 'Email found', 'critical', 'No email address was found in the text layer.')
  }
  if (PHONE.test(text)) {
    push('phone', 'Phone found', 'ok', 'A phone number was found.')
  } else {
    push('phone', 'Phone found', 'warning', 'No phone number was found.')
  }

  // 3. Section headings are how a parser segments the document.
  const lower = text.toLowerCase()
  const detected = SECTION_WORDS.filter((word) => lower.includes(word))
  if (detected.length >= 3) {
    push('sections', 'Section headings', 'ok', `Recognised: ${detected.slice(0, 8).join(', ')}.`)
  } else {
    push(
      'sections',
      'Section headings',
      'warning',
      'Few standard headings found. Parsers segment on words like Experience, Education and Skills.',
    )
  }

  // 4. Hyphenation corrupts whatever it splits, and URLs are the worst case.
  const split = HYPHEN_SPLIT.exec(text)
  if (split) {
    push(
      'hyphenation',
      'No broken words',
      'warning',
      `A word is split across lines ("${split[0]}"), so it reaches the parser broken.`,
    )
  } else {
    push('hyphenation', 'No broken words', 'ok', 'No hyphen-split words detected.')
  }

  // 5. Column detection: if many lines start at two clearly separated x
  // positions, the page is multi-column and reading order is at risk.
  const starts = lines.map((line) => Math.round(line.x / 10) * 10)
  const histogram = new Map<number, number>()
  for (const start of starts) histogram.set(start, (histogram.get(start) ?? 0) + 1)
  const common = [...histogram.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2)
  const twoColumns =
    common.length === 2 &&
    Math.abs(common[0][0] - common[1][0]) > 120 &&
    common[1][1] >= Math.max(4, lines.length * 0.15)

  if (twoColumns) {
    push(
      'columns',
      'Single reading column',
      'warning',
      'This looks like a two-column layout. Parsers differ on these: the safest submission is a single column.',
    )
  } else {
    push('columns', 'Single reading column', 'ok', 'Content reads as a single column.')
  }

  return {
    pageCount: flat.pageCount,
    wordCount: words.length,
    checks,
    extractedText: text,
    detectedSections: detected,
  }
}
