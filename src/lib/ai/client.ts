import type { AiFeature } from './prompts'

export type AiErrorKind = 'network' | 'rate' | 'server'

export class AiError extends Error {
  readonly kind: AiErrorKind

  constructor(message: string, kind: AiErrorKind) {
    super(message)
    this.name = 'AiError'
    this.kind = kind
  }
}

export interface AiResult {
  text: string
}

interface RequestAiOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

/**
 * Calls the app's AI endpoint (/api/ai). The endpoint is served by the
 * Vercel function in production and a Vite middleware in dev, so the
 * upstream API key never leaves the server.
 */
export async function requestAi(
  feature: AiFeature,
  payload: unknown,
  options: RequestAiOptions = {},
): Promise<AiResult> {
  const { signal, timeoutMs = 45_000 } = options
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  const onOuterAbort = () => controller.abort()
  signal?.addEventListener('abort', onOuterAbort)

  try {
    let response: Response
    try {
      response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, payload }),
        signal: controller.signal,
      })
    } catch {
      throw new AiError(
        'Could not reach the AI service. Check your connection and try again.',
        'network',
      )
    }

    if (response.status === 429) {
      throw new AiError('The AI service is busy. Wait a moment and try again.', 'rate')
    }
    if (!response.ok) {
      throw new AiError('The AI service returned an error. Try again.', 'server')
    }

    const data: unknown = await response.json().catch(() => null)
    if (!data || typeof (data as { text?: unknown }).text !== 'string') {
      throw new AiError('The AI service returned an unexpected response. Try again.', 'server')
    }
    return { text: (data as { text: string }).text }
  } finally {
    window.clearTimeout(timeout)
    signal?.removeEventListener('abort', onOuterAbort)
  }
}
