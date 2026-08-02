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
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ text: 'A tight summary.' }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await requestAi('improve-summary', { summary: 'x' })

    expect(result.text).toBe('A tight summary.')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/ai')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      feature: 'improve-summary',
      payload: { summary: 'x' },
    })
  })

  it('maps 429 to a rate error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 429)))
    await expect(requestAi('improve-summary', {})).rejects.toMatchObject({
      kind: 'rate',
    })
  })

  it('maps 5xx to a server error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)))
    await expect(requestAi('improve-summary', {})).rejects.toMatchObject({
      kind: 'server',
    })
  })

  it('maps network failures to a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(requestAi('improve-summary', {})).rejects.toMatchObject({
      kind: 'network',
    })
  })
})
