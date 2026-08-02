import type { ResumeDocument, ResumeDocumentV1, SectionId } from '@rb/core/types/document'
import { ALL_SECTIONS } from '@rb/core/types/document'
import { resumeDocumentV1Schema } from '@rb/core/schema/v1'
import { safeParseV3 } from '@rb/core/schema/v3'

function ensureSectionOrder(order: SectionId[]): SectionId[] {
  const merged = [...order]
  for (const sectionId of ALL_SECTIONS) {
    if (!merged.includes(sectionId)) merged.push(sectionId)
  }
  return merged.filter((sectionId) => ALL_SECTIONS.includes(sectionId))
}

function cleanGuides(
  guides: Partial<Record<SectionId, string>> | undefined,
): Partial<Record<SectionId, string>> {
  const cleaned: Partial<Record<SectionId, string>> = {}
  if (!guides) return cleaned
  for (const [sectionId, text] of Object.entries(guides)) {
    const trimmed = (text ?? '').trim()
    if (trimmed) cleaned[sectionId as SectionId] = trimmed
  }
  return cleaned
}

export function migrateV1ToV3(doc: ResumeDocumentV1): ResumeDocument {
  return {
    ...doc,
    certifications: doc.certifications ?? [],
    volunteer: doc.volunteer ?? [],
    references: doc.references ?? [],
    meta: {
      schemaVersion: 3,
      documentType: doc.meta.documentType,
      presetId: 'international-generic',
      templateId: doc.meta.templateId,
      themeId: doc.meta.templateId === 'academic' ? 'academic-serif' : 'navy-corporate',
      exportProfile: 'standard',
      locale: 'en-US',
      sectionOrder: ensureSectionOrder(doc.meta.sectionOrder),
      hiddenSections: doc.meta.hiddenSections,
      sectionGuides: {},
      pageSize: doc.meta.pageSize,
      updatedAt: doc.meta.updatedAt,
    },
  }
}

/**
 * Single guarantee point: returns a valid, normalized v3 `ResumeDocument`
 * (with `ensureSectionOrder`, cleaned sectionGuides, and default-fills
 * applied) or `null`. All ingestion paths (storage, file import) must go
 * through this function.
 */
export function parseAndMigrate(data: unknown): ResumeDocument | null {
  if (!data || typeof data !== 'object') return null
  const record = data as { meta?: { schemaVersion?: number } }

  if (record.meta?.schemaVersion === 3) {
    const raw = data as ResumeDocument
    const normalized = {
      ...(data as object),
      certifications: raw.certifications ?? [],
      volunteer: raw.volunteer ?? [],
      references: raw.references ?? [],
      meta: {
        ...raw.meta,
        sectionOrder: ensureSectionOrder(raw.meta?.sectionOrder ?? ALL_SECTIONS),
        sectionGuides: cleanGuides(raw.meta?.sectionGuides),
      },
    }
    const parsed = safeParseV3(normalized)
    return parsed.success ? (parsed.data as ResumeDocument) : null
  }

  if (record.meta?.schemaVersion === 2) {
    const raw = data as ResumeDocument
    const normalized = {
      ...(data as object),
      certifications: raw.certifications ?? [],
      volunteer: raw.volunteer ?? [],
      references: raw.references ?? [],
      meta: {
        ...raw.meta,
        schemaVersion: 3,
        sectionOrder: ensureSectionOrder(raw.meta?.sectionOrder ?? ALL_SECTIONS),
        sectionGuides: {},
      },
    }
    const parsed = safeParseV3(normalized)
    return parsed.success ? (parsed.data as ResumeDocument) : null
  }

  const v1 = resumeDocumentV1Schema.safeParse(data)
  if (v1.success) return migrateV1ToV3(v1.data)

  return null
}
