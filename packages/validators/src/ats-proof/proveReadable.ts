import type { ResumeDocument } from '@rb/core/types/document'
import { groundTruthFor } from '@rb/validators/ats-proof/groundTruth'
import { checkExtraction, extractPdfText, type AtsFinding } from '@rb/validators/ats-proof/extractPdfText'
import type { LintIssue } from '@rb/validators/types'

/**
 * Proves the exported PDF is readable by a parser (F-007): extract its text the way a parser would and check every
 * visible field of the document that produced it survived, in order, with no word split across a line. Each kind of
 * failure is one ATS risk (a warning), with an example, so a broken template does not bury the panel.
 */
const MESSAGES: Record<AtsFinding['kind'], (count: number, example: string) => string> = {
  'missing-field': (n, ex) =>
    `${n} piece${n === 1 ? '' : 's'} of text could not be read back from the PDF (for example "${ex}"). A parser would miss ${n === 1 ? 'it' : 'them'}.`,
  'reading-order': (_n, ex) =>
    `Text comes out of the PDF in a different order than it reads (around "${ex}"). A parser may attach it to the wrong entry.`,
  'empty-page': (n) => `${n} page${n === 1 ? ' has' : 's have'} no readable text.`,
  'hyphen-split': (_n, ex) => `A word is split across lines ("${ex}"), so a keyword search will not find it.`,
  'no-embedded-font': () => 'The PDF embeds no font, so some viewers and parsers may substitute or garble text.',
}

const CODES: Record<AtsFinding['kind'], string> = {
  'missing-field': 'PDF_TEXT_MISSING',
  'reading-order': 'PDF_READING_ORDER',
  'empty-page': 'PDF_EMPTY_PAGE',
  'hyphen-split': 'PDF_BROKEN_WORD',
  'no-embedded-font': 'PDF_NO_FONT',
}

export function findingsToIssues(findings: AtsFinding[]): LintIssue[] {
  const byKind = new Map<AtsFinding['kind'], AtsFinding[]>()
  for (const finding of findings) byKind.set(finding.kind, [...(byKind.get(finding.kind) ?? []), finding])
  return [...byKind.entries()].map(([kind, list]) => ({
    level: 'warning' as const,
    code: CODES[kind],
    message: MESSAGES[kind](list.length, list[0].detail.slice(0, 60)),
  }))
}

/** Extracts `pdf` and checks it against `document`, which must be the document the PDF was rendered from. */
export async function proveReadable(pdf: Blob, document: ResumeDocument): Promise<LintIssue[]> {
  const extracted = await extractPdfText(new Uint8Array(await pdf.arrayBuffer()))
  return findingsToIssues(checkExtraction(extracted, groundTruthFor(document)))
}
