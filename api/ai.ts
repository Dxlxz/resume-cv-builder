/**
 * Vercel serverless function: POST /api/ai
 * Body: { feature: AiFeature, payload: object }
 *
 * Self-contained proxy to the OpenCode Go API. Kept dependency-free on
 * purpose: Vercel bundles this file standalone, and importing from src/
 * has proven fragile in deployments. The identical logic (shared with the
 * Vite dev middleware) lives in src/lib/ai/server.ts — keep the two in
 * sync when changing validation, the model, or the upstream URL.
 *
 * The API key is read from the OPENCODE_GO_API_KEY environment variable
 * only — it never ships in the client bundle. Stateless: no logging, no
 * storage.
 */

const UPSTREAM = 'https://opencode.ai/zen/go/v1/chat/completions'
const MODEL = 'deepseek-v4-flash'
const MAX_TOKENS = 1200
const TEMPERATURE = 0.4
const MAX_BODY_CHARS = 60_000

interface ChatMessage {
  role: string
  content: string
}

interface AiRequest {
  method?: string
  body?: unknown
}

interface AiResponse {
  status(code: number): { json(body: unknown): void }
  setHeader(name: string, value: string): void
}

function buildMessages(feature: string, payload: unknown): ChatMessage[] | null {
  if (typeof payload !== 'object' || payload === null) return null
  const p = payload as Record<string, unknown>

  if (feature === 'improve-summary') {
    if (typeof p.summary !== 'string' || !Array.isArray(p.experience)) return null
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage(p, 'summary') },
    ]
  }
  if (feature === 'improve-bullets') {
    const role = p.role as Record<string, unknown> | null | undefined
    if (!role || typeof role.title !== 'string' || !Array.isArray(role.bullets)) return null
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage(p, 'bullets') },
    ]
  }
  if (feature === 'tailor-to-job') {
    if (
      typeof p.jobDescription !== 'string' ||
      typeof p.summary !== 'string' ||
      !Array.isArray(p.skills)
    ) {
      return null
    }
    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage(p, 'tailor') },
    ]
  }
  return null
}

function userMessage(p: Record<string, unknown>, kind: 'summary' | 'bullets' | 'tailor'): string {
  if (kind === 'summary') {
    const experience = (p.experience as unknown[])
      .map((e) => {
        const r = e as Record<string, unknown>
        const bullets = Array.isArray(r.bullets)
          ? (r.bullets as string[]).map((b) => `- ${b}`).join('\n')
          : ''
        return `${r.title ?? ''}, ${r.company ?? ''}\n${bullets}`
      })
      .join('\n\n')
    return `Rewrite the professional summary below. Keep it 2 to 4 sentences. Use the work experience to support your claims, but do not invent anything.
Document type: ${p.documentType === 'cv' ? 'CV' : 'Resume'}
Current summary:
"${p.summary || '(empty)'}"
Work experience:
${experience || '(no work experience recorded)'}`
  }
  if (kind === 'bullets') {
    const role = p.role as Record<string, unknown>
    const bullets = Array.isArray(role.bullets)
      ? (role.bullets as string[]).map((b) => `- ${b}`).join('\n')
      : '- (no bullets recorded)'
    return `Rewrite the bullet points for this role. Aim for 3 to 6 bullets. Each bullet should start with a plain verb, say what was done, and where possible include a measurable outcome. Do not add facts that are not in the source.
Role: ${role.company ? `${role.title}, ${role.company}` : role.title}
Current bullets:
${bullets}
Return only the rewritten bullets, one per line, with no numbers, dashes, or labels.`
  }
  const skills = Array.isArray(p.skills) ? (p.skills as string[]).map((s) => `- ${s}`).join('\n') : '- (none recorded)'
  const experience = Array.isArray(p.experience)
    ? (p.experience as unknown[])
        .map((e) => {
          const r = e as Record<string, unknown>
          const bullets = Array.isArray(r.bullets)
            ? (r.bullets as string[]).map((b) => `- ${b}`).join('\n')
            : ''
          return `${r.title ?? ''}, ${r.company ?? ''}\n${bullets}`
        })
        .join('\n\n')
    : '(no work experience recorded)'
  return `Tailor the candidate document below to the job description.
Target document type: ${p.documentType === 'cv' ? 'CV' : 'Resume'}.
Job description:
"""${p.jobDescription}"""
Current summary:
"${p.summary || '(empty)'}"
Skills on the document:
${skills}
Work experience:
${experience}
Return exactly this structure, with nothing before or after it:
TAILORED SUMMARY
{2 to 4 sentences that use keywords from the job description where they honestly apply}
MISSING KEYWORDS
{comma-separated keywords or phrases from the job description that are absent or understated in the document, that the candidate can honestly claim}
BULLET SUGGESTIONS
{bullet rewrites for existing experience that better match the job description. Prefix each line with the role, for example "Software Engineer: ...". Only suggest changes the candidate could honestly make.}`
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

export default async function handler(req: AiRequest, res: AiResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.OPENCODE_GO_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'AI is not configured on this deployment.' })
    return
  }

  const body = req.body
  if (typeof body !== 'object' || body === null) {
    res.status(400).json({ error: 'Invalid request.' })
    return
  }
  const { feature, payload } = body as { feature?: unknown; payload?: unknown }
  if (typeof feature !== 'string' || feature.length > 40) {
    res.status(400).json({ error: 'Invalid feature.' })
    return
  }
  if (JSON.stringify(body).length > MAX_BODY_CHARS) {
    res.status(413).json({ error: 'Request too large.' })
    return
  }

  const messages = buildMessages(feature, payload)
  if (!messages) {
    res.status(400).json({ error: 'Invalid payload.' })
    return
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    if (upstream.status === 429) {
      res.status(429).json({ error: 'The AI service is busy. Try again in a moment.' })
      return
    }
    if (!upstream.ok) {
      res.status(502).json({ error: 'The AI service returned an error.' })
      return
    }

    const data: unknown = await upstream.json().catch(() => null)
    const text = (data as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]
      ?.message?.content
    if (typeof text !== 'string') {
      res.status(502).json({ error: 'Unexpected response from the AI service.' })
      return
    }
    res.status(200).json({ text: text.trim() })
  } catch {
    res.status(502).json({ error: 'The AI service is unavailable.' })
  }
}
