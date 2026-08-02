import type { ResumeDocument, ResumeDocumentV1, SectionId } from '@rb/core/types/document'
import { ALL_SECTIONS } from '@rb/core/types/document'
import { resumeDocumentV1Schema } from '@rb/core/schema/v1'
import { safeParseV2 } from '@rb/core/schema/v2'

function ensureSectionOrder(order: SectionId[]): SectionId[] {
  const merged = [...order]
  for (const sectionId of ALL_SECTIONS) {
    if (!merged.includes(sectionId)) merged.push(sectionId)
  }
  return merged.filter((sectionId) => ALL_SECTIONS.includes(sectionId))
}

export function migrateV1ToV2(doc: ResumeDocumentV1): ResumeDocument {
  return {
    ...doc,
    certifications: doc.certifications ?? [],
    volunteer: doc.volunteer ?? [],
    references: doc.references ?? [],
    meta: {
      schemaVersion: 2,
      documentType: doc.meta.documentType,
      presetId: 'international-generic',
      templateId: doc.meta.templateId,
      themeId: doc.meta.templateId === 'academic' ? 'academic-serif' : 'navy-corporate',
      exportProfile: 'standard',
      locale: 'en-US',
      sectionOrder: ensureSectionOrder(doc.meta.sectionOrder),
      hiddenSections: doc.meta.hiddenSections,
      pageSize: doc.meta.pageSize,
      updatedAt: doc.meta.updatedAt,
    },
  }
}

/**
 * Single guarantee point: returns a valid, normalized v2 `ResumeDocument`
 * (with `ensureSectionOrder` and default-fills applied) or `null`. All
 * ingestion paths (storage, file import) must go through this function.
 */
export function parseAndMigrate(data: unknown): ResumeDocument | null {
  if (!data || typeof data !== 'object') return null
  const record = data as { meta?: { schemaVersion?: number } }

  if (record.meta?.schemaVersion === 2) {
    const raw = data as ResumeDocument
    const normalized = {
      ...(data as object),
      certifications: raw.certifications ?? [],
      volunteer: raw.volunteer ?? [],
      references: raw.references ?? [],
      meta: {
        ...raw.meta,
        sectionOrder: ensureSectionOrder(raw.meta?.sectionOrder ?? ALL_SECTIONS),
      },
    }
    const parsed = safeParseV2(normalized)
    return parsed.success ? parsed.data : null
  }

  const v1 = resumeDocumentV1Schema.safeParse(data)
  if (v1.success) return migrateV1ToV2(v1.data)

  return null
}
