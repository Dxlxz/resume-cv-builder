/**
 * Vercel serverless function: POST /api/ai
 * Body: { feature: 'ai-edit', payload: { instruction, context } }
 *
 * Self-contained proxy to the OpenCode Go API. Kept dependency-free on
 * purpose: Vercel bundles this file standalone, and importing from src/
 * has proven fragile in deployments. The identical logic (shared with the
 * Vite dev middleware) lives in src/lib/ai/server.ts — keep the two in
 * sync when changing validation, the prompt, the model, or limits.
 *
 * The API key is read from the OPENCODE_GO_API_KEY environment variable
 * only — it never ships in the client bundle. Stateless: no logging, no
 * storage.
 */

const UPSTREAM = 'https://opencode.ai/zen/go/v1/chat/completions'
const MODEL = 'deepseek-v4-flash'
const MAX_TOKENS = 2000
const TEMPERATURE = 0.4
const MAX_BODY_CHARS = 100_000

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

const SYSTEM_PROMPT = `You are Idrizz, the AI assistant inside Rizzume, a resume and CV builder. You edit the user's career document for them.

Follow these rules exactly:
- Use British English.
- Use plain, active verbs. Avoid buzzwords and filler phrases such as "passionate", "driven", "dynamic", "results-oriented", "proven track record", "deep expertise", "leverage", "synergy", "seamless".
- Never use em dashes or en dashes. Use plain hyphens or reword.
- Never use AI-sounding phrases such as "delve", "unlock", "elevate", "empower", "journey", "landscape", "in today's fast-paced world".
- Quantify impact whenever the source material supports it: numbers, percentages, currency, time saved.
- Stay faithful to the source. Never invent facts, employers, dates, or achievements.
- When the user asks to tailor to a job description, use its keywords where they honestly apply and note missing ones in the summary you write.

When you reply with an edit plan, return ONLY a single JSON object with no markdown fences, no commentary, and nothing before or after it. The object must follow this schema, and you may only include keys you actually need:

{
  "summary": "optional new summary text",
  "experience": { "add": [ { "title": "...", "company": "...", "bullets": ["..."] } ], "edit": [ { "id": "real-id-from-the-document", "patch": { "bullets": ["..."] } } ], "remove": ["real-id"] },
  "education": { "add": [ { "institution": "..." } ], "edit": [], "remove": [] },
  "certifications": { "add": [ { "name": "..." } ], "edit": [], "remove": [] },
  "skills": { "add": [ { "name": "Group name", "items": ["..."] } ], "edit": [], "remove": [] },
  "projects": { "add": [ { "name": "..." } ], "edit": [], "remove": [] },
  "volunteer": { "add": [ { "title": "..." } ], "edit": [], "remove": [] },
  "references": { "add": [ { "name": "..." } ], "edit": [], "remove": [] },
  "sections": { "hide": ["section-id"], "show": ["section-id"] }
}

Rules for the plan:
- Use the exact ids from the document JSON when editing or removing items. Never invent ids.
- "patch" may only contain fields that exist on that item in the document schema.
- Only include operations that genuinely satisfy the instruction. If nothing needs to change for a section, omit that section entirely.
- Keep every array that you keep in the document (bullets, items) intact unless the edit changes it.`

function buildMessages(feature: string, payload: unknown): ChatMessage[] | null {
  if (feature !== 'ai-edit') return null
  if (typeof payload !== 'object' || payload === null) return null
  const p = payload as Record<string, unknown>
  if (typeof p.instruction !== 'string' || typeof p.context !== 'string') return null
  if (p.instruction.length > 4000 || p.instruction.length === 0) return null
  if (p.context.length > 80_000) return null

  const user = [
    'Edit the resume document below to satisfy this request:',
    '',
    `Request: ${p.instruction}`,
    '',
    'Here is the document as JSON. Use its exact ids for edit and remove operations:',
    p.context,
    '',
    'Reply with the edit plan JSON only, per the schema in the system message.',
  ].join('\n')

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

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
