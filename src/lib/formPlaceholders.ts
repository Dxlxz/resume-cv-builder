/** Hint text shown in empty form fields (not saved until user types).
 *  Generic product copy — never personal data (see src/test/fixtures). */
export const FORM_PLACEHOLDERS = {
  contact: {
    fullName: 'e.g. Jordan Tan',
    headline: 'e.g. Software Engineer | Web & Geospatial',
    email: 'name/email.com',
    phone: '+60 12-345 6789',
    location: 'e.g. Kuala Lumpur, Malaysia',
    linkedIn: 'https://linkedin.com/in/your-name',
    website: 'https://your-site.dev',
  },
  summary:
    'e.g. Software engineer with two years building web features, dashboards, and integrations for government clients.',
  experience: {
    title: 'e.g. Software Engineer',
    company: 'e.g. Company Sdn Bhd',
    location: 'e.g. Kuala Lumpur',
    bullet: 'e.g. Built automation that reduced manual data entry time by 40%.',
  },
  education: {
    institution: 'e.g. Universiti Teknologi Malaysia',
    degree: 'e.g. Bachelor of Computer Science (Hons)',
    field: 'e.g. Software Engineering',
    honors: 'e.g. Dean\'s List',
  },
  skills: {
    groupName: 'Tools & Technologies',
    item: 'e.g. Python, React, Docker',
  },
  projects: {
    name: 'e.g. Dashboard for Local Council',
    url: 'https://github.com/your-name/project',
    description: 'e.g. Web dashboard combining map services with a live front end.',
    bullet: 'e.g. Implemented the data pipeline from database to browser.',
  },
} as const
