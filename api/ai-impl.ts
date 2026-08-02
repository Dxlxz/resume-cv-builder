/**
 * Canonical server-side AI proxy logic - the single source of truth shared
 * by the Vercel function (api/ai.ts) and the Vite dev middleware.
 *
 * Vercel compiles each api/*.ts file standalone (no bundling), so this
 * module is deliberately self-contained: no imports, no .ts specifiers,
 * no aliases. The prompt and the message builder live here so the Vercel
 * function and dev can never drift. Stateless: no logging of payloads, no
 * storage, no rate counters.
 */

export type AiFeature = 'ai-edit'

const UPSTREAM = 'https://opencode.ai/zen/go/v1/chat/completions'
const MODEL = 'deepseek-v4-flash'
const MAX_TOKENS = 2000
const TEMPERATURE = 0.4
const MAX_BODY_CHARS = 100_000
const MAX_CONTEXT_CHARS = 80_000
const MAX_INSTRUCTION_CHARS = 4000

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

const SYSTEM_PROMPT = `You are Idrizz, the AI assistant inside Rizzume, a resume and CV builder. You edit the user's career document for them. You are a warm, direct, Malaysian-flavoured resume wingman: brief, cheerful, and straight to the point when you talk to the user.

Follow these rules exactly:
- Use British English.
- Use plain, active verbs. Avoid buzzwords and filler phrases such as "passionate", "driven", "dynamic", "results-oriented", "proven track record", "deep expertise", "leverage", "synergy", "seamless".
- Never use em dashes or en dashes. Use plain hyphens or reword.
- Never use AI-sounding phrases such as "delve", "unlock", "elevate", "empower", "journey", "landscape", "in today's fast-paced world".
- Quantify impact whenever the source material supports it: numbers, percentages, currency, time saved.
- Stay faithful to the source. Never invent facts, employers, dates, or achievements.
- Respect the user's section guides for each section (in the document's meta.sectionGuides). Never contradict them; if a guide is empty, use the default rules.
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

export function buildAiEditMessages(input: {
  instruction: string
  context: string
}): ChatMessage[] {
  const user = [
    'Edit the resume document below to satisfy this request:',
    '',
    `Request: ${input.instruction}`,
    '',
    'Here is the document as JSON. Use its exact ids for edit and remove operations:',
    input.context,
    '',
    'Reply with the edit plan JSON only, per the schema in the system message.',
  ].join('\n')

  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: user },
  ]
}

export interface AiProxyResult {
  status: number
  json: unknown
}

function buildMessages(feature: AiFeature, payload: unknown): ChatMessage[] | null {
  if (feature !== 'ai-edit') return null
  if (typeof payload !== 'object' || payload === null) return null
  const p = payload as Record<string, unknown>
  if (typeof p.instruction !== 'string' || typeof p.context !== 'string') return null
  if (p.instruction.length > MAX_INSTRUCTION_CHARS || p.instruction.length === 0) return null
  if (p.context.length > MAX_CONTEXT_CHARS) return null
  return buildAiEditMessages({ instruction: p.instruction, context: p.context })
}

export async function runAiProxy(
  body: unknown,
  apiKey: string | undefined,
): Promise<AiProxyResult> {
  if (!apiKey) {
    return { status: 500, json: { error: 'AI is not configured on this deployment.' } }
  }
  if (typeof body !== 'object' || body === null) {
    return { status: 400, json: { error: 'Invalid request.' } }
  }

  const { feature, payload } = body as { feature?: unknown; payload?: unknown }
  if (typeof feature !== 'string' || feature.length > 40) {
    return { status: 400, json: { error: 'Invalid feature.' } }
  }
  const serialized = JSON.stringify(body)
  if (serialized.length > MAX_BODY_CHARS) {
    return { status: 413, json: { error: 'Request too large.' } }
  }

  const messages = buildMessages(feature as AiFeature, payload)
  if (!messages) {
    return { status: 400, json: { error: 'Invalid payload.' } }
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
      console.error(`[ai-proxy] upstream rate limited (429) for ${feature}`)
      return { status: 429, json: { error: 'The AI service is busy. Try again in a moment.' } }
    }
    if (!upstream.ok) {
      console.error(`[ai-proxy] upstream error ${upstream.status} for ${feature} (${MODEL})`)
      return { status: 502, json: { error: 'The AI service returned an error.' } }
    }

    const data: unknown = await upstream.json().catch(() => null)
    const text = (data as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]
      ?.message?.content
    if (typeof text !== 'string') {
      console.error(`[ai-proxy] upstream response missing text for ${feature}`)
      return { status: 502, json: { error: 'Unexpected response from the AI service.' } }
    }
    return { status: 200, json: { text: text.trim() } }
  } catch (err) {
    console.error(`[ai-proxy] upstream request failed for ${feature}: ${String(err)}`)
    return { status: 502, json: { error: 'The AI service is unavailable.' } }
  }
}
