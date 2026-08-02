import type { CatalogBundleManifest, CatalogEntry } from '@rb/catalog/types'

export const internationalManifest: CatalogBundleManifest = {
  id: 'international-default',
  name: 'International — Generic',
  version: '1.0.0',
  locale: 'en-US',
  presetIds: ['international-generic'],
  updatedAt: '2026-06-11T00:00:00.000Z',
}

function e(
  id: string,
  catalogType: CatalogEntry['catalogType'],
  label: string,
  extra: Partial<CatalogEntry> = {},
): CatalogEntry {
  return { id, catalogType, label, locale: 'en-US', active: true, ...extra }
}

export const internationalEntries: CatalogEntry[] = [
  e('cat-industry', 'skill-category', 'Industry Knowledge', { sortOrder: 1 }),
  e('cat-tools', 'skill-category', 'Tools & Technologies', { sortOrder: 2 }),
  e('cat-interpersonal', 'skill-category', 'Interpersonal Skills', { sortOrder: 3 }),
  e('skill-py', 'skill', 'Python', { categoryId: 'cat-tools' }),
  e('skill-js', 'skill', 'JavaScript', { categoryId: 'cat-tools', aliases: ['JS'] }),
  e('skill-ts', 'skill', 'TypeScript', { categoryId: 'cat-tools', aliases: ['TS'] }),
  e('skill-react', 'skill', 'React', { categoryId: 'cat-tools' }),
  e('skill-node', 'skill', 'Node.js', { categoryId: 'cat-tools' }),
  e('skill-sql', 'skill', 'SQL', { categoryId: 'cat-tools' }),
  e('skill-aws', 'skill', 'Amazon Web Services (AWS)', { categoryId: 'cat-tools', aliases: ['AWS'] }),
  e('skill-leadership', 'skill', 'Leadership', { categoryId: 'cat-interpersonal' }),
  e('lang-en', 'language', 'English'),
  e('lang-es', 'language', 'Spanish'),
  e('prof-full', 'language-proficiency', 'Full professional proficiency'),
  e('prof-professional', 'language-proficiency', 'Professional working proficiency'),
  e('prof-elementary', 'language-proficiency', 'Elementary proficiency'),
  e('occ-swe', 'occupation', 'Software Engineer', { industryId: 'ind-tech' }),
  e('occ-data-scientist', 'occupation', 'Data Scientist', { industryId: 'ind-tech' }),
  e('occ-pm', 'occupation', 'Product Manager', { industryId: 'ind-tech' }),
  e('ind-tech', 'industry', 'Information Technology'),
  e('ind-finance', 'industry', 'Financial Services'),
  e('inst-generic', 'institution', 'University of Example'),
  e('deg-bsc', 'degree-type', 'B.S. Computer Science'),
  e('deg-msc', 'degree-type', 'M.S. Computer Science'),
  e('loc-us', 'location', 'Austin, TX'),
  e('loc-uk', 'location', 'London, UK'),
]
