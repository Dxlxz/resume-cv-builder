import { buildAiEditMessages, type AiFeature } from './prompts.ts'

/**
 * Server-side AI proxy logic, shared by the Vercel function (api/ai.ts) and
 * the Vite dev middleware. Validates the request, builds the prompt, and
 * forwards it to the OpenCode Go API with the key. Stateless: no logging,
 * no storage, no rate counters.
 */

export interface AiProxyResult {
  status: number
  json: unknown
}

const UPSTREAM = 'https://opencode.ai/zen/go/v1/chat/completions'
const MODEL = 'deepseek-v4-flash'
const MAX_TOKENS = 2000
const TEMPERATURE = 0.4
const MAX_BODY_CHARS = 100_000

function buildMessages(feature: AiFeature, payload: unknown): { role: 'system' | 'user'; content: string }[] | null {
  if (feature !== 'ai-edit') return null
  if (typeof payload !== 'object' || payload === null) return null
  const p = payload as Record<string, unknown>
  if (typeof p.instruction !== 'string' || typeof p.context !== 'string') return null
  if (p.instruction.length > 4000 || p.instruction.length === 0) return null
  if (p.context.length > 80_000) return null
  return buildAiEditMessages({ instruction: p.instruction, context: p.context })
}

export async function runAiProxy(body: unknown, apiKey: string | undefined): Promise<AiProxyResult> {
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
      return { status: 429, json: { error: 'The AI service is busy. Try again in a moment.' } }
    }
    if (!upstream.ok) {
      return { status: 502, json: { error: 'The AI service returned an error.' } }
    }

    const data: unknown = await upstream.json().catch(() => null)
    const text = (data as { choices?: { message?: { content?: unknown } }[] } | null)?.choices?.[0]
      ?.message?.content
    if (typeof text !== 'string') {
      return { status: 502, json: { error: 'Unexpected response from the AI service.' } }
    }
    return { status: 200, json: { text: text.trim() } }
  } catch {
    return { status: 502, json: { error: 'The AI service is unavailable.' } }
  }
}
