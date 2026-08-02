import type { ResumeDocument } from '@rb/core/types/document'
import { createId } from '@rb/core/utils'

/**
 * Fictional sample documents used as product fixtures (tests, previews,
 * "start blank" demos). NOT real personal data — do not import Dale's
 * personal pack from the product; that lives in `personal/` (private).
 *
 * Volume mirrors a realistic Malaysia-flavoured junior profile so layout,
 * parity, and lint tests exercise real content sizes. Skill labels reuse
 * the default catalog vocabulary so coverage tests resolve them.
 */

const baseMeta = {
  schemaVersion: 2 as const,
  sectionOrder: [
    'contact',
    'summary',
    'experience',
    'education',
    'certifications',
    'skills',
    'projects',
    'volunteer',
    'references',
  ] as const,
  hiddenSections: [] as const,
  updatedAt: new Date().toISOString(),
}

/** Complete profile — every bullet, project, certification, and entry. */
export const sampleProfileDocument: ResumeDocument = {
  meta: {
    ...baseMeta,
    documentType: 'resume',
    presetId: 'malaysia-corporate',
    templateId: 'ats-strict',
    themeId: 'navy-corporate',
    exportProfile: 'standard',
    locale: 'en-MY',
    pageSize: 'a4',
    sectionOrder: [...baseMeta.sectionOrder],
    hiddenSections: [],
  },
  contact: {
    fullName: 'Jordan Tan Wei Ming',
    headline: 'Software Engineer | Web & Geospatial',
    email: 'jordan.tan.dev@example.com',
    phone: '+60 12-345 6789',
    location: 'Kuala Lumpur, Malaysia',
    linkedIn: 'https://linkedin.com/in/jordan-tan-dev',
    website: 'https://jordantan.dev',
  },
  summary:
    'Software engineer with about two years of industry experience at a geospatial solutions company, promoted from internship to a permanent role within the first year. Daily work covers workflow automation, web mapping services, client web features built with React, Next.js, and Node.js, and Power BI dashboards for government clients. Seeking junior software engineer roles in Malaysia.',
  experience: [
    {
      id: createId(),
      title: 'Software Engineer',
      company: 'MapWorks Systems Sdn Bhd',
      location: 'Kuala Lumpur',
      startDate: '2024-11',
      endDate: '',
      present: true,
      bullets: [
        'Develop web features for client deliverables with React, Next.js, and Node.js, including REST endpoints and authentication.',
        'Build n8n workflows that sync field data into internal dashboards and cut manual data entry.',
        'Publish map services through GeoServer and maintain spatial data layers in PostgreSQL.',
      ],
    },
    {
      id: createId(),
      title: 'Software Development (Internship)',
      company: 'MapWorks Systems Sdn Bhd',
      location: 'Kuala Lumpur',
      startDate: '2024-03',
      endDate: '2024-08',
      present: false,
      bullets: [
        'Built internal automations in n8n to connect third-party and in-house APIs for sync and alerts.',
        'Created and maintained data layers in PostgreSQL and MySQL, including queries, views, and small ETL jobs.',
        'Produced maps and spatial analysis in QGIS and ArcGIS Pro for client projects.',
      ],
    },
  ],
  education: [
    {
      id: createId(),
      institution: 'Universiti Teknologi Malaysia',
      degree: 'Bachelor of Computer Science (Hons)',
      field: 'Software Engineering',
      startDate: '2020-09',
      endDate: '2024-06',
      honors: 'Dean\'s List',
    },
  ],
  certifications: [
    {
      id: createId(),
      name: 'n8n Basics',
      issuer: 'n8n (official platform)',
      completed: '2024',
    },
    {
      id: createId(),
      name: 'ArcGIS Pro Essential',
      issuer: 'Esri (in-house training)',
      completed: '2024',
    },
    {
      id: createId(),
      name: 'Getting Started with Microsoft Excel',
      issuer: 'Coursera Project Network',
      completed: '2025',
    },
  ],
  skills: [
    {
      id: createId(),
      name: 'Industry Knowledge',
      items: [
        'Geographic Information Systems (GIS)',
        'Business Intelligence (BI)',
        'Data Engineering',
        'Workflow Automation',
        'Web Mapping',
        'Extract, Transform, Load (ETL)',
      ],
    },
    {
      id: createId(),
      name: 'Tools & Technologies',
      items: [
        'JavaScript',
        'TypeScript',
        'React.js / React',
        'Next.js',
        'Node.js',
        'Express.js',
        'SQL',
        'PostgreSQL',
        'MySQL',
        'Microsoft Power BI',
        'GeoServer',
        'ArcGIS Pro',
        'QGIS',
        'n8n',
        'Docker',
        'Python',
        'Git / GitHub / GitLab',
      ],
    },
    {
      id: createId(),
      name: 'Languages',
      items: ['English — Full professional', 'Malay — Full professional'],
    },
  ],
  projects: [
    {
      id: createId(),
      name: 'Spatial Dashboard for Local Council',
      url: 'https://github.com/jordan-tan-dev/spatial-dashboard',
      description:
        'Web dashboard combining GeoServer map services with a React front end for municipal asset tracking.',
      bullets: [
        'Designed the map layer pipeline from PostgreSQL through GeoServer to the browser.',
        'Implemented filtering and search over spatial datasets with a live preview.',
      ],
    },
    {
      id: createId(),
      name: 'Order Data Pipeline',
      description:
        'n8n-based automation that syncs order data between a client system and an internal reporting database.',
      bullets: [
        'Replaced manual nightly data entry with a scheduled sync workflow.',
        'Added failure alerts and a summary dashboard in Power BI.',
      ],
    },
    {
      id: createId(),
      name: 'Portfolio Site',
      url: 'https://jordantan.dev',
      description: 'Personal portfolio built with Next.js and deployed to Vercel.',
      bullets: ['Static generation with a CMS-backed blog.', 'Light and dark themes with system preference.'],
    },
  ],
  volunteer: [
    {
      id: createId(),
      title: 'Vice President (Events)',
      company: 'Computer Science Student Association',
      location: 'Johor Bahru',
      startDate: '2022-09',
      endDate: '2023-08',
      present: false,
      bullets: [
        'Organised tech talks and workshops for 200+ members across two semesters.',
        'Coordinated venue, speakers, and publicity with a five-person committee.',
      ],
    },
    {
      id: createId(),
      title: 'Volunteer Crew',
      company: 'National Tech Conference',
      location: 'Kuala Lumpur',
      startDate: '2023-07',
      endDate: '2023-07',
      present: false,
      bullets: ['Guided delegates and supported session changeovers during a 1,000+ attendee event.'],
    },
  ],
  references: [
    {
      id: createId(),
      name: 'Ahmad Faizal',
      title: 'Engineering Manager',
      company: 'MapWorks Systems Sdn Bhd',
      phone: '+60 13-000 0000',
      email: 'ahmad.faizal@example.com',
    },
  ],
}

/** Curated 2-page resume — max 3 bullets per item, strongest projects only. */
export const sampleResumeDocument: ResumeDocument = {
  ...sampleProfileDocument,
  meta: {
    ...sampleProfileDocument.meta,
    documentType: 'resume',
  },
  contact: { ...sampleProfileDocument.contact },
  summary: sampleProfileDocument.summary,
  experience: sampleProfileDocument.experience.map((item) => ({
    ...item,
    bullets: item.bullets.slice(0, 3),
  })),
  education: sampleProfileDocument.education,
  certifications: sampleProfileDocument.certifications.slice(0, 2),
  skills: sampleProfileDocument.skills,
  projects: sampleProfileDocument.projects.slice(0, 2),
  volunteer: sampleProfileDocument.volunteer.slice(0, 1),
  references: sampleProfileDocument.references,
}

/**
 * Complete CV — academic template, no page cap. Roles carry long bullet
 * lists (11 and 8) so layout tests exercise item fragmentation.
 */
export const sampleCvDocument: ResumeDocument = {
  ...sampleProfileDocument,
  meta: {
    ...sampleProfileDocument.meta,
    documentType: 'cv',
    templateId: 'academic',
    themeId: 'academic-serif',
    pageSize: 'a4',
  },
  experience: [
    {
      id: createId(),
      title: 'Software Engineer',
      company: 'MapWorks Systems Sdn Bhd',
      location: 'Kuala Lumpur',
      startDate: '2024-11',
      endDate: '',
      present: true,
      bullets: [
        'Develop web features for client deliverables with React, Next.js, and Node.js, including REST endpoints and authentication.',
        'Build n8n workflows that sync field data into internal dashboards and cut manual data entry.',
        'Publish map services through GeoServer and maintain spatial data layers in PostgreSQL.',
        'Deliver Power BI dashboards for project tracking and decision support with a small technical team.',
        'Containerise services with Docker and document deployment steps for the team.',
        'Integrate AI-assisted document requirement checks into a government web application.',
        'Maintain spatial data layers in PostgreSQL and MSSQL with views and small ETL jobs.',
        'Write T-SQL views for internal data flows and reporting.',
        'Prototype retrieval workflows to surface internal documents in apps and automation pipelines.',
        'Set up Docker hosts, containerised services, and configured server infrastructure.',
        'Deploy and manage services on Azure, including VMs, storage, and basic networking.',
      ],
    },
    {
      id: createId(),
      title: 'Software Development (Internship)',
      company: 'MapWorks Systems Sdn Bhd',
      location: 'Kuala Lumpur',
      startDate: '2024-03',
      endDate: '2024-08',
      present: false,
      bullets: [
        'Built internal automations in n8n to connect third-party and in-house APIs for sync and alerts.',
        'Created and maintained data layers in PostgreSQL and MySQL, including queries, views, and small ETL jobs.',
        'Produced maps and spatial analysis in QGIS and ArcGIS Pro for client projects.',
        'Developed web features with Next.js, React, and Node.js, including REST endpoints and authentication.',
        'Used Git, GitHub, and GitLab for version control, code review, and issue tracking.',
        'Prototyped retrieval workflows to surface internal documents in apps and automation pipelines.',
        'Maintained spatial databases and integration patterns between GIS and internal APIs.',
        'Completed advanced ArcGIS Pro data processing and workflow automation logic.',
      ],
    },
  ],
}

/** International (non-Malaysia) curated resume fixture — US-flavoured. */
export const sampleInternationalResumeDocument: ResumeDocument = {
  meta: {
    ...baseMeta,
    documentType: 'resume',
    presetId: 'international-generic',
    templateId: 'classic',
    themeId: 'navy-corporate',
    exportProfile: 'standard',
    locale: 'en-US',
    pageSize: 'letter',
    sectionOrder: [...baseMeta.sectionOrder],
    hiddenSections: [],
  },
  contact: {
    fullName: 'Alex Morgan',
    email: 'alex.morgan/email.com',
    phone: '(555) 123-4567',
    location: 'Austin, TX',
    linkedIn: 'https://linkedin.com/in/alexmorgan',
    website: 'https://alexmorgan.dev',
  },
  summary:
    'Product-minded software engineer with 5+ years building web applications. Focused on clean UX, reliable delivery, and measurable business impact.',
  experience: [
    {
      id: createId(),
      title: 'Senior Software Engineer',
      company: 'Northline Labs',
      location: 'Remote',
      startDate: '2022-03',
      endDate: '',
      present: true,
      bullets: [
        'Led migration of customer dashboard to React, reducing page load time by 40%.',
        'Mentored 3 junior engineers and established frontend testing standards.',
        'Shipped billing integration that increased self-serve upgrades by 18%.',
      ],
    },
  ],
  education: [
    {
      id: createId(),
      institution: 'University of Texas at Austin',
      degree: 'B.S. Computer Science',
      field: 'Computer Science',
      startDate: '2015-08',
      endDate: '2019-05',
      honors: 'Cum Laude',
    },
  ],
  certifications: [],
  skills: [
    {
      id: createId(),
      name: 'Languages',
      items: ['TypeScript', 'JavaScript', 'Python'],
    },
  ],
  projects: [],
  volunteer: [],
  references: [],
}
