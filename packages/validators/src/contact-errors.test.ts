import { describe, expect, it } from 'vitest'
import { createEmptyDocument } from '@rb/presets/createDocument'
import { runValidation } from '@rb/validators/ats-lint'

describe('contact validation', () => {
  it('reports at most one error per field for an empty resume (AC-8)', () => {
    const issues = runValidation(createEmptyDocument('resume', 'malaysia-corporate'))
    const errorFields = issues.filter((i) => i.level === 'error' && i.field).map((i) => i.field)
    expect(errorFields.length).toBeGreaterThan(0)
    expect(new Set(errorFields).size).toBe(errorFields.length)
  })

  it('says an empty email is required, not also invalid (AC-8)', () => {
    const issues = runValidation(createEmptyDocument('resume', 'malaysia-corporate'))
    const email = issues.filter((i) => i.field === 'email')
    expect(email).toHaveLength(1)
    expect(email[0].message).toMatch(/required/i)
  })

  it('reports an invalid email once it is typed wrongly (AC-8)', () => {
    const doc = createEmptyDocument('resume', 'malaysia-corporate')
    doc.contact = { fullName: 'Aisyah Rahman', email: 'not-an-email' }
    const email = runValidation(doc).filter((i) => i.field === 'email')
    expect(email).toHaveLength(1)
    expect(email[0].message).toMatch(/valid/i)
  })
})
