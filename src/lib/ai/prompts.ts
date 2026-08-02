/**
 * Prompt builders for AI-assisted writing. Server-side only (api/ai.ts and
 * the Vite dev middleware) except `parseTailorResult`, which the client uses.
 * Kept free of @rb/* imports so the Vite config can load it without aliases.
 */

export type AiFeature = 'improve-summary' | 'improve-bullets' | 'tailor-to-job'

export type DocType = 'resume' | 'cv'

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

export interface RoleLite {
  title: string
  company: string
  bullets: string[]
}

const SYSTEM_PROMPT = `You are an expert resume and CV writer. You rewrite career documents so they are specific, honest, and easy for both recruiters and applicant tracking systems (ATS) to read.

Follow these rules exactly:
- Use British English.
- Use plain, active verbs. Avoid buzzwords and filler phrases such as "passionate", "driven", "dynamic", "results-oriented", "proven track record", "deep expertise", "leverage", "synergy", "seamless".
- Never use em dashes or en dashes. Use plain hyphens or reword.
- Never use AI-sounding phrases such as "delve", "unlock", "elevate", "empower", "journey", "landscape", "in today's fast-paced world".
- Quantify impact whenever the source material supports it: numbers, percentages, currency, time saved.
- Stay faithful to the source. Never invent facts, employers, dates, or achievements.
- Output plain text only. No markdown, no headings, no labels, no commentary.`

function roleBlock(role: RoleLite): string {
  const head = role.company ? `${role.title}, ${role.company}` : role.title
  const bullets = role.bullets.length
    ? role.bullets.map((b) => `- ${b}`).join('\n')
    : '- (no bullets recorded)'
  return `${head}\n${bullets}`
}

export function buildImproveSummaryMessages(input: {
  summary: string
  experience: RoleLite[]
  documentType: DocType
  presetName: string
}): ChatMessage[] {
  const experienceBlock = input.experience.length
    ? input.experience.map(roleBlock).join('\n\n')
    : '(no work experience recorded)'
  const user = [
    'Rewrite the professional summary below.',
    `Keep it ${input.documentType === 'cv' ? '4 to 6 sentences' : '2 to 4 sentences'}.`,
    'Use the work experience to support your claims, but do not invent anything.',
    '',
    `Document type: ${input.documentType === 'cv' ? 'CV' : 'Resume'}`,
    input.presetName ? `Preset: ${input.presetName}` : '',
    '',
    'Current summary:',
    `"${input.summary || '(empty)'}"`,
    '',
    'Work experience:',
    experienceBlock,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

export function buildImproveBulletsMessages(role: RoleLite): ChatMessage[] {
  const user = [
    'Rewrite the bullet points for this role.',
    'Aim for 3 to 6 bullets. Each bullet should start with a plain verb in the tense that fits the role, say what was done, and where possible include a measurable outcome.',
    'Do not add facts that are not in the source.',
    '',
    role.company ? `Role: ${role.title}, ${role.company}` : `Role: ${role.title}`,
    '',
    'Current bullets:',
    role.bullets.length ? role.bullets.map((b) => `- ${b}`).join('\n') : '- (no bullets recorded)',
    '',
    'Return only the rewritten bullets, one per line, with no numbers, dashes, or labels.',
  ].join('\n')

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

export function buildTailorToJobMessages(input: {
  jobDescription: string
  summary: string
  skills: string[]
  experience: RoleLite[]
  documentType: DocType
}): ChatMessage[] {
  const skillsBlock = input.skills.length ? input.skills.map((s) => `- ${s}`).join('\n') : '- (none recorded)'
  const experienceBlock = input.experience.length
    ? input.experience.map(roleBlock).join('\n\n')
    : '(no work experience recorded)'
  const user = [
    'Tailor the candidate document below to the job description.',
    `Target document type: ${input.documentType === 'cv' ? 'CV' : 'Resume'}.`,
    '',
    'Job description:',
    `"""${input.jobDescription}"""`,
    '',
    'Current summary:',
    `"${input.summary || '(empty)'}"`,
    '',
    'Skills on the document:',
    skillsBlock,
    '',
    'Work experience:',
    experienceBlock,
    '',
    'Return exactly this structure, with nothing before or after it:',
    '',
    'TAILORED SUMMARY',
    `{${input.documentType === 'cv' ? '4 to 6 sentences' : '2 to 4 sentences'} that use keywords from the job description where they honestly apply}`,
    '',
    'MISSING KEYWORDS',
    '{comma-separated keywords or phrases from the job description that are absent or understated in the document, that the candidate can honestly claim}',
    '',
    'BULLET SUGGESTIONS',
    '{bullet rewrites for existing experience that better match the job description. Prefix each line with the role, for example "Software Engineer: ...". Only suggest changes the candidate could honestly make.}',
  ].join('\n')

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

export interface TailorResult {
  tailoredSummary: string
  missingKeywords: string[]
  bulletSuggestions: string
}

const SUMMARY_HEADER = /^TAILORED SUMMARY$/m
const KEYWORDS_HEADER = /^MISSING KEYWORDS$/m
const BULLETS_HEADER = /^BULLET SUGGESTIONS$/m

/** Splits the model output into the three tailor sections. */
export function parseTailorResult(text: string): TailorResult {
  const summaryMatch = SUMMARY_HEADER.exec(text)
  const keywordsMatch = KEYWORDS_HEADER.exec(text)
  const bulletsMatch = BULLETS_HEADER.exec(text)

  if (!summaryMatch || !keywordsMatch || !bulletsMatch) {
    return { tailoredSummary: text.trim(), missingKeywords: [], bulletSuggestions: '' }
  }

  const tailoredSummary = text.slice(summaryMatch.index + summaryMatch[0].length, keywordsMatch.index).trim()
  const keywordsText = text.slice(keywordsMatch.index + keywordsMatch[0].length, bulletsMatch.index).trim()
  const bulletSuggestions = text.slice(bulletsMatch.index + bulletsMatch[0].length).trim()
  const missingKeywords = keywordsText
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)

  return { tailoredSummary, missingKeywords, bulletSuggestions }
}
