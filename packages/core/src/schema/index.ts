export * from '@rb/core/schema/shared'
export * from '@rb/core/schema/v3'
export { parseAndMigrate } from '@rb/core/schema/migrate'
export { safeParseV1, resumeDocumentV1Schema } from '@rb/core/schema/v1'

import { parseAndMigrate } from '@rb/core/schema/migrate'
import { safeParseV3 } from '@rb/core/schema/v3'

export function safeParseDocument(data: unknown) {
  const migrated = parseAndMigrate(data)
  if (migrated) return { success: true as const, data: migrated }
  const v3 = safeParseV3(data)
  if (v3.success) return v3
  return { success: false as const, error: v3.error }
}
