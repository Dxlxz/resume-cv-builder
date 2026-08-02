import { buildAiEditMessages, type AiFeature } from '../src/lib/ai/prompts.ts'

/**
 * Canonical server-side AI proxy logic - the single source of truth shared
 * by the Vercel function (api/ai.ts) and the Vite dev middleware. Kept
 * free of @rb/* imports so both entry points can load it relatively.
 * Stateless: no logging of payloads, no storage, no rate counters.
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
const MAX_CONTEXT_CHARS = 80_000
const MAX_INSTRUCTION_CHARS = 4000

function buildMessages(
  feature: AiFeature,
  payload: unknown,
): { role: 'system' | 'user'; content: string }[] | null {
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
