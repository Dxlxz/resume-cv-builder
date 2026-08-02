import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestAi } from '@/lib/ai/client'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('requestAi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('posts the feature and payload to /api/ai and returns the text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ text: '{"summary":"x"}' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await requestAi('ai-edit', { instruction: 'tidy it', context: '{}' })

    expect(result.text).toBe('{"summary":"x"}')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/ai')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      feature: 'ai-edit',
      payload: { instruction: 'tidy it', context: '{}' },
    })
  })

  it('maps 429 to a rate error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 429)))
    await expect(requestAi('ai-edit', {})).rejects.toMatchObject({
      kind: 'rate',
    })
  })

  it('maps 5xx to a server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)))
    await expect(requestAi('ai-edit', {})).rejects.toMatchObject({
      kind: 'server',
    })
  })

  it('maps network failures to a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(requestAi('ai-edit', {})).rejects.toMatchObject({
      kind: 'network',
    })
  })
})
