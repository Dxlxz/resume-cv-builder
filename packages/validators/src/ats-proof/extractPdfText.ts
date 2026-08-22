/**
 * Text-layer extraction — what a resume parser sees.
 *
 * This is the layer where most ATS failures happen: the PDF's text layer is
 * broken, garbled, or missing, and the parser falls back to OCR or to nothing.
 * Reading the text back out with an independent engine (pdf.js, not react-pdf)
 * is what makes the check meaningful — if the producer also graded its own
 * output the test would prove nothing.
 */

export interface ExtractedPdf {
  pageCount: number
  /** Text per page, in the order the content stream emits it. */
  pages: string[]
  /** All pages joined — the flat stream a naive parser reads. */
  text: string
  /** Fonts embedded in the file, subset prefixes stripped. */
  fonts: string[]
}

function normalise(text: string): string {
  // Collapse whitespace so assertions are not defeated by line wrapping: a
  // field split across two lines is still correctly extracted.
  return text.replace(/\s+/g, ' ').trim()
}

export async function extractPdfText(bytes: Uint8Array): Promise<ExtractedPdf> {
  // Scan for embedded fonts BEFORE handing the bytes to pdf.js: getDocument
  // takes ownership of the buffer and detaches it, so reading afterwards sees
  // an empty array and reports every file as fontless.
  const raw = Buffer.from(bytes).toString('latin1')
  const fonts = [
    ...new Set(
      [...raw.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-,]+)/g)].map((m) =>
        m[1].replace(/^[A-Z]{6}\+/, ''),
      ),
    ),
  ]

  // Legacy build: works under node without a DOM.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({
    data: bytes,
    // Silence font-substitution chatter; we assert on embedded fonts directly.
    useSystemFonts: false,
  }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const items = content.items as Array<{ str?: string }>
    pages.push(normalise(items.map((item) => item.str ?? '').join(' ')))
  }

  return { pageCount: doc.numPages, pages, text: pages.join(' '), fonts }
}

export interface AtsFinding {
  kind: 'missing-field' | 'reading-order' | 'empty-page' | 'hyphen-split' | 'no-embedded-font'
  detail: string
}

/** A word broken across a line break leaves "xxx- yyy" in the text stream. */
const HYPHEN_SPLIT = /[A-Za-z]{2,}- [a-z]{2,}/g

export function checkExtraction(
  extracted: ExtractedPdf,
  truth: { fields: string[]; order: string[] },
): AtsFinding[] {
  const findings: AtsFinding[] = []
  const haystack = extracted.text

  for (const field of truth.fields) {
    const needle = normalise(field)
    if (needle.length === 0) continue
    if (!haystack.includes(needle)) {
      findings.push({ kind: 'missing-field', detail: needle })
    }
  }

  // Reading order: each anchor must appear after the previous one. A layout
  // that interleaves columns fails here even though every field is present.
  let cursor = -1
  for (const anchor of truth.order) {
    const needle = normalise(anchor)
    const at = haystack.indexOf(needle, cursor + 1)
    if (at === -1) {
      // Missing entirely is already reported as a missing field.
      if (haystack.includes(needle)) {
        findings.push({ kind: 'reading-order', detail: needle })
      }
      continue
    }
    cursor = at
  }

  extracted.pages.forEach((page, i) => {
    if (page.length === 0) {
      findings.push({ kind: 'empty-page', detail: `page ${i + 1} has no text layer` })
    }
  })

  for (const match of haystack.matchAll(HYPHEN_SPLIT)) {
    findings.push({ kind: 'hyphen-split', detail: match[0] })
  }

  if (extracted.fonts.length === 0) {
    findings.push({ kind: 'no-embedded-font', detail: 'no /BaseFont entries' })
  }

  return findings
}
