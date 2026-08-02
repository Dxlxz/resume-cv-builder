export * from '@rb/core/schema/shared'
export * from '@rb/core/schema/v2'
export { migrateV1ToV2, parseAndMigrate } from '@rb/core/schema/migrate'
export { safeParseV1, resumeDocumentV1Schema } from '@rb/core/schema/v1'

import { parseAndMigrate } from '@rb/core/schema/migrate'
import { safeParseV2 } from '@rb/core/schema/v2'

export function safeParseDocument(data: unknown) {
  const migrated = parseAndMigrate(data)
  if (migrated) return { success: true as const, data: migrated }
  const v2 = safeParseV2(data)
  if (v2.success) return v2
  return { success: false as const, error: v2.error }
}
