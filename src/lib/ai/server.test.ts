import { afterEach, describe, expect, it, vi } from 'vitest'
import { runAiProxy } from '@/lib/ai/server'

const FAKE_KEY = 'opencode-go-test-key-12345'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const validBody = {
  feature: 'ai-edit',
  payload: { instruction: 'Rewrite my summary.', context: '{"summary":"x"}' },
}

describe('runAiProxy', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('rejects when the API key is not configured', async () => {
    const result = await runAiProxy(validBody, undefined)
    expect(result.status).toBe(500)
  })

  it('rejects non-object bodies', async () => {
    const result = await runAiProxy(null, FAKE_KEY)
    expect(result.status).toBe(400)
  })

  it('rejects unknown features', async () => {
    const result = await runAiProxy({ feature: 'hack', payload: {} }, FAKE_KEY)
    expect(result.status).toBe(400)
  })

  it('rejects malformed ai-edit payloads', async () => {
    const result = await runAiProxy(
      { feature: 'ai-edit', payload: { instruction: 42 } },
      FAKE_KEY,
    )
    expect(result.status).toBe(400)
  })

  it('rejects empty instructions', async () => {
    const result = await runAiProxy(
      { feature: 'ai-edit', payload: { instruction: '', context: '{}' } },
      FAKE_KEY,
    )
    expect(result.status).toBe(400)
  })

  it('rejects oversized bodies', async () => {
    const result = await runAiProxy(
      { feature: 'ai-edit', payload: { instruction: 'x'.repeat(120_000), context: '{}' } },
      FAKE_KEY,
    )
    expect(result.status).toBe(413)
  })

  it('forwards to OpenCode Go with the key and returns the text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: '  {"summary":"tighter"}  ' } }],
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await runAiProxy(validBody, FAKE_KEY)

    expect(result.status).toBe(200)
    expect((result.json as { text: string }).text).toBe('{"summary":"tighter"}')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://opencode.ai/zen/go/v1/chat/completions')
    expect((init as RequestInit).headers).toMatchObject({ Authorization: `Bearer ${FAKE_KEY}` })
    const sent = JSON.parse((init as RequestInit).body as string)
    expect(sent.model).toBe('deepseek-v4-flash')
    expect(sent.messages[0].role).toBe('system')
    expect(sent.messages[1].content).toContain('Rewrite my summary.')
  })

  it('maps upstream 429 to 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 429)))
    const result = await runAiProxy(validBody, FAKE_KEY)
    expect(result.status).toBe(429)
  })

  it('maps upstream 5xx to 502', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)))
    const result = await runAiProxy(validBody, FAKE_KEY)
    expect(result.status).toBe(502)
  })

  it('rejects responses without text content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ choices: [] })))
    const result = await runAiProxy(validBody, FAKE_KEY)
    expect(result.status).toBe(502)
  })

  it('maps network failures to 502', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')))
    const result = await runAiProxy(validBody, FAKE_KEY)
    expect(result.status).toBe(502)
  })
})
