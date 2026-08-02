import type { CatalogBundleManifest, CatalogEntry } from '@rb/catalog/types'

export const malaysiaManifest: CatalogBundleManifest = {
  id: 'malaysia-default',
  name: 'Malaysia — Corporate & Tech',
  version: '1.1.0',
  locale: 'en-MY',
  presetIds: ['malaysia-corporate'],
  updatedAt: '2026-06-11T00:00:00.000Z',
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

function e(
  id: string,
  catalogType: CatalogEntry['catalogType'],
  label: string,
  extra: Partial<CatalogEntry> = {},
): CatalogEntry {
  return {
    id,
    catalogType,
    label,
    locale: 'en-MY',
    active: true,
    ...extra,
  }
}

const categories: CatalogEntry[] = [
  e('cat-industry', 'skill-category', 'Industry Knowledge', { sortOrder: 1 }),
  e('cat-tools', 'skill-category', 'Tools & Technologies', { sortOrder: 2 }),
  e('cat-interpersonal', 'skill-category', 'Interpersonal Skills', { sortOrder: 3 }),
  e('cat-other', 'skill-category', 'Other Skills', { sortOrder: 4 }),
]

const industrySkills = [
  'Geospatial Intelligence',
  'Geographic Information Systems (GIS)',
  'Business Intelligence (BI)',
  'Data Science',
  'Data Engineering',
  'Machine Learning',
  'Artificial Intelligence (AI)',
  'Deep Learning',
  'Natural Language Processing (NLP)',
  'Retrieval-Augmented Generation (RAG)',
  'Vector Search',
  'Statistics',
  'Statistical Modeling',
  'Data Visualization',
  'Web Mapping',
  'Workflow Automation',
  'Extract, Transform, Load (ETL)',
  'Big Data Analytics',
  'Data Mining',
  'Predictive Modeling',
  'Model Explainability',
  'API Design',
  'System Integration',
  'Cloud Computing',
  'DevOps',
  'Database Design',
  'Computer Science',
  'Data Structures',
  'Anti-Money Laundering (AML)',
  'Credit Risk Modeling',
  'Payments Systems',
  'ISO 20022',
  'Software Architecture',
  'Technical Writing',
].map((label, i) =>
  e(`skill-ind-${slug(label)}`, 'skill', label, { categoryId: 'cat-industry', sortOrder: i }),
)

const toolSkills: CatalogEntry[] = [
  ['Python', ['py']],
  ['R', []],
  ['JavaScript', ['JS']],
  ['TypeScript', ['TS']],
  ['React.js', ['React']],
  ['Next.js', ['NextJS']],
  ['Node.js', ['Node']],
  ['Express.js', ['Express']],
  ['FastAPI', []],
  ['HTML', []],
  ['CSS', []],
  ['Tailwind CSS', ['Tailwind']],
  ['C++', []],
  ['C', []],
  ['SQL', []],
  ['Transact-SQL (T-SQL)', ['T-SQL', 'MS SQL', 'MSSQL']],
  ['Microsoft SQL Server', ['SQL Server', 'MSSQL']],
  ['SQL Server Management Studio', ['SSMS']],
  ['PostgreSQL', ['Postgres']],
  ['MySQL', []],
  ['MongoDB', []],
  ['Supabase', []],
  ['Redis', []],
  ['Pandas', []],
  ['NumPy', []],
  ['Scikit-Learn', ['sklearn', 'scikit-learn']],
  ['TensorFlow', ['TF']],
  ['PyTorch', []],
  ['SHAP', []],
  ['Microsoft Power BI', ['Power BI']],
  ['Apache Superset', ['Superset']],
  ['Tableau', []],
  ['ArcGIS Pro', ['ArcGIS']],
  ['ArcGIS Experience Builder', ['Experience Builder']],
  ['ArcPy', []],
  ['QGIS', []],
  ['GeoServer', []],
  ['n8n', []],
  ['Docker', []],
  ['Kubernetes', ['K8s']],
  ['Azure', ['Microsoft Azure']],
  ['Amazon Web Services (AWS)', ['AWS']],
  ['Terraform', []],
  ['Linux', []],
  ['Git / GitHub / GitLab', ['Git', 'GitHub', 'GitLab']],
  ['GitHub Actions', []],
  ['CI/CD', ['CICD']],
  ['REST APIs', ['REST', 'RESTful API']],
  ['GraphQL', []],
  ['OpenAPI', ['Swagger']],
  ['Apache Kafka', ['Kafka']],
  ['Apache Spark', ['Spark']],
  ['Grafana', []],
  ['Streamlit', []],
  ['LangChain', []],
  ['Hugging Face', ['HuggingFace']],
  ['OpenAI API', ['OpenAI']],
  ['Vite', []],
  ['Figma', []],
].map(([label, aliases], i) =>
  e(`skill-tool-${slug(String(label))}`, 'skill', String(label), {
    categoryId: 'cat-tools',
    aliases: aliases as string[],
    sortOrder: i,
  }),
)

const interpersonalSkills = [
  'Leadership',
  'Problem Solving',
  'Analytical Skills',
  'Communication',
  'Team Collaboration',
  'Technical Documentation',
  'Critical Thinking',
  'Time Management',
  'Stakeholder Management',
  'Mentoring',
  'Cross-functional Collaboration',
  'Presentation Skills',
].map((label, i) =>
  e(`skill-soft-${slug(label)}`, 'skill', label, { categoryId: 'cat-interpersonal', sortOrder: i }),
)

const otherSkills = [
  'Project Management',
  'Agile / Scrum',
  'Product Management',
  'Requirements Gathering',
  'Quality Assurance (QA)',
].map((label, i) =>
  e(`skill-other-${slug(label)}`, 'skill', label, { categoryId: 'cat-other', sortOrder: i }),
)

const languages: CatalogEntry[] = [
  e('lang-en', 'language', 'English', { sortOrder: 1 }),
  e('lang-ms', 'language', 'Malay', { sortOrder: 2 }),
  e('lang-zh', 'language', 'Chinese', { sortOrder: 3 }),
  e('lang-ja', 'language', 'Japanese', { sortOrder: 4 }),
  e('lang-tamil', 'language', 'Tamil', { sortOrder: 5 }),
]

const proficiencies: CatalogEntry[] = [
  e('prof-native', 'language-proficiency', 'Native or bilingual proficiency', { sortOrder: 1 }),
  e('prof-full', 'language-proficiency', 'Full professional proficiency', { sortOrder: 2 }),
  e('prof-professional', 'language-proficiency', 'Professional working proficiency', { sortOrder: 3 }),
  e('prof-limited', 'language-proficiency', 'Limited working proficiency', { sortOrder: 4 }),
  e('prof-elementary', 'language-proficiency', 'Elementary proficiency', { sortOrder: 5 }),
]

const industries: CatalogEntry[] = [
  'Information Technology',
  'Geospatial & GIS Services',
  'Data Science & Analytics',
  'Banking & Financial Services',
  'Oil & Gas',
  'Government & Public Sector',
  'Telecommunications',
  'Education',
  'Construction & Engineering',
  'Healthcare',
].map((label, i) => e(`ind-${slug(label)}`, 'industry', label, { sortOrder: i }))

const occupations: CatalogEntry[] = [
  ['occ-gis-assistant', 'Assistant - Geospatial & Software Solutions', 'ind-gis'],
  ['occ-gis-trainee', 'Trainee - Geospatial & Software Solutions', 'ind-gis'],
  ['occ-swe-intern', 'Software Development (Internship)', 'ind-it'],
  ['occ-data-scientist', 'Data Scientist', 'ind-data'],
  ['occ-ml-engineer', 'Applied ML Engineer', 'ind-data'],
  ['occ-swe', 'Software Engineer', 'ind-it'],
  ['occ-gis-analyst', 'GIS Analyst', 'ind-gis'],
  ['occ-data-analyst', 'Data Analyst', 'ind-data'],
  ['occ-bi-developer', 'Business Intelligence Developer', 'ind-data'],
  ['occ-fullstack', 'Full Stack Developer', 'ind-it'],
  ['occ-backend', 'Backend Developer', 'ind-it'],
  ['occ-automation', 'Automation Engineer', 'ind-it'],
].map(([id, label, industryId], i) =>
  e(id, 'occupation', label, { industryId, sortOrder: i }),
)

const institutions: CatalogEntry[] = [
  'Universiti Malaysia Sabah',
  'Universiti Malaya',
  'Universiti Teknologi Malaysia',
  'Universiti Malaysia Sarawak',
  'Universiti Kebangsaan Malaysia',
  'Universiti Sains Malaysia',
  'Universiti Malaysia Sabah',
  'Politeknik Kota Kinabalu',
  'TAR UMT',
  'Sunway University',
].map((label, i) => e(`inst-${slug(label)}`, 'institution', label, { sortOrder: i }))

const degreeTypes: CatalogEntry[] = [
  'BSc (Hons) Computer Science (Data Science)',
  'BSc (Hons) Computer Science',
  'Bachelor of Computer Science',
  'Diploma in Computer Science',
  'MSc Data Science',
  'PhD Computer Science',
  'SPM',
  'STPM',
].map((label, i) => e(`deg-${slug(label)}`, 'degree-type', label, { sortOrder: i }))

const locations: CatalogEntry[] = [
  'Kota Kinabalu, Sabah, Malaysia',
  'Sabah, Malaysia',
  'Kuala Lumpur, Malaysia',
  'Selangor, Malaysia',
  'Penang, Malaysia',
  'Johor Bahru, Malaysia',
  'Sarawak, Malaysia',
  'Putrajaya, Malaysia',
  'Cyberjaya, Selangor',
  'Petaling Jaya, Selangor',
  'Malaysia',
].map((label, i) => e(`loc-${slug(label)}`, 'location', label, { sortOrder: i }))

const certifications: CatalogEntry[] = [
  ['cert-aws', 'AWS Certified Solutions Architect'],
  ['cert-azure', 'Microsoft Azure Fundamentals'],
  ['cert-gis', 'Esri Technical Certification'],
  ['cert-pmp', 'Project Management Professional (PMP)'],
  ['cert-google-ds', 'Google Data Analytics Certificate'],
].map(([id, label], i) => e(id, 'certification', label, { sortOrder: i }))

export const malaysiaEntries: CatalogEntry[] = [
  ...categories,
  ...industrySkills.filter(
    (entry, index, arr) => arr.findIndex((x) => x.label === entry.label) === index,
  ),
  ...toolSkills,
  ...interpersonalSkills,
  ...otherSkills,
  ...languages,
  ...proficiencies,
  ...industries,
  ...occupations,
  ...institutions.filter(
    (entry, index, arr) => arr.findIndex((x) => x.label === entry.label) === index,
  ),
  ...degreeTypes,
  ...locations,
  ...certifications,
]
