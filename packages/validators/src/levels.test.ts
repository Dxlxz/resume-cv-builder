/**
 * @vitest-environment node
 *
 * F-007 AC-1: style, length and layout rules are tips. No ATS rejects a resume for margins, fonts or page count, so
 * these rule files may only raise `info`. The one exception is content the preset hides from the PDF.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TEMPLATE_IDS, type ResumeDocument } from '@rb/core/types/document'
import { sampleCvDocument, sampleMalaysiaResume, sampleResumeDocument } from '@rb/fixtures'
import { runValidation } from '@rb/validators/ats-lint'

const here = dirname(fileURLToPath(import.meta.url))
const STYLE_RULE_FILES = ['typography-lint.ts', 'spacing-lint.ts', 'length-lint.ts', 'paginate-lint.ts', 'catalog-lint.ts']
/** Codes in those files allowed above `info`, and why. */
const ALLOWED = new Set(['BULLETS_HIDDEN_BY_PRESET']) // content is missing from the PDF

describe('style rules are tips (AC-1)', () => {
  it.each(STYLE_RULE_FILES)('%s raises no warning or error except allowed codes', (file) => {
    const source = readFileSync(join(here, file), 'utf8')
    const raised = [...source.matchAll(/level: '(warning|error)',\s+code: '([A-Z_0-9]+)'/g)].map((m) => m[2])
    expect(raised.filter((code) => !ALLOWED.has(code))).toEqual([])
  })
})

/** Every code allowed to be a warning: things that stop a parser or a recruiter's search finding content. */
const ATS_RISK_CODES = new Set([
  'EXPERIENCE_DATES_MISSING', 'IC_NUMBER_DETECTED', 'PERSONAL_DETAILS', 'BULLETS_HIDDEN_BY_PRESET',
  'PDF_TEXT_MISSING', 'PDF_READING_ORDER', 'PDF_EMPTY_PAGE', 'PDF_BROKEN_WORD', 'PDF_NO_FONT',
])

describe('warnings at run time are ATS risks only (AC-1)', () => {
  const docs: [string, ResumeDocument][] = [
    ['resume', sampleResumeDocument],
    ['Malaysia resume', sampleMalaysiaResume],
    ['CV', sampleCvDocument],
  ]
  it.each(docs)('%s across every template, at 1 to 5 preview pages', (_label, base) => {
    for (const templateId of TEMPLATE_IDS) {
      const doc = { ...base, meta: { ...base.meta, templateId } }
      for (const pages of [1, 2, 3, 4, 5]) {
        const warnings = runValidation(doc, null, pages).filter((i) => i.level === 'warning')
        expect(warnings.filter((i) => !ATS_RISK_CODES.has(i.code))).toEqual([])
      }
    }
  })
})