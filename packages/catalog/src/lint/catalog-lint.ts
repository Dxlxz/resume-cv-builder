import type { ResumeDocument } from '@rb/core/types/document'
import type { LintIssue } from '@rb/validators/types'
import { useCatalogStore } from '@rb/catalog/store/catalogStore'
import { findNearMatch, resolveEntryByLabel } from '@rb/catalog/search'

function duplicateCaseInGroup(items: string[]): string[] {
  const seen = new Map<string, string>()
  const dupes: string[] = []
  for (const item of items) {
    const key = item.trim().toLowerCase()
    if (!key) continue
    const prior = seen.get(key)
    if (prior && prior !== item.trim()) dupes.push(item.trim())
    else seen.set(key, item.trim())
  }
  return dupes
}

export function runCatalogRules(document: ResumeDocument): LintIssue[] {
  const issues: LintIssue[] = []
  const skills = useCatalogStore.getState().getEntries('skill')
  const occupations = useCatalogStore.getState().getEntries('occupation')

  for (const group of document.skills) {
    const dupes = duplicateCaseInGroup(group.items)
    for (const dupe of dupes) {
      issues.push({
        level: 'info',
        code: 'CATALOG_DUPLICATE_CASE',
        message: `Duplicate skill with different casing: "${dupe}" in ${group.name || 'skills'}.`,
        section: 'skills',
      })
    }

    for (const item of group.items) {
      const trimmed = item.trim()
      if (!trimmed) continue
      if (resolveEntryByLabel(skills, trimmed)) continue
      const near = findNearMatch(skills, trimmed)
      if (near) {
        issues.push({
          level: 'info',
          code: 'CATALOG_NEAR_MATCH',
          message: `"${trimmed}" is close to catalog entry "${near.label}". Consider using the canonical label.`,
          section: 'skills',
        })
      }
    }
  }

  for (const role of document.experience) {
    const title = role.title.trim()
    if (!title) continue
    if (resolveEntryByLabel(occupations, title)) continue
    if (title.length < 3) {
      issues.push({
        level: 'info',
        code: 'CATALOG_UNKNOWN_OCCUPATION',
        message: `Job title "${title}" is very short and not in the occupation catalog.`,
        section: 'experience',
        field: 'title',
      })
    }
  }

  return issues
}
