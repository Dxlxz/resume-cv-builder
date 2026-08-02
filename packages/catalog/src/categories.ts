/**
 * Skill-group helpers for the skills editor. Kept in the catalog package
 * because the group names map to catalog categories (cat-industry,
 * cat-tools, cat-interpersonal, cat-other).
 */

export function categoryIdForSkillGroupName(groupName: string): string | undefined {
  const n = groupName.trim().toLowerCase()
  if (n.includes('industry') || n.includes('domain') || n.includes('knowledge')) return 'cat-industry'
  if (n.includes('tool') || n.includes('technolog')) return 'cat-tools'
  if (n.includes('interpersonal') || n.includes('soft')) return 'cat-interpersonal'
  if (n.includes('other')) return 'cat-other'
  return undefined
}

export function isLanguagesSkillGroup(groupName: string): boolean {
  return groupName.trim().toLowerCase().includes('language')
}
