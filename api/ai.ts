import { runAiProxy } from '../src/lib/ai/server.ts'

/**
 * Vercel serverless function: POST /api/ai
 * Body: { feature: AiFeature, payload: object }
 * Forwards to OpenCode Go with the API key from the environment. Stateless.
 */

interface AiRequest {
  method?: string
  body?: unknown
}

interface AiResponse {
  status(code: number): { json(body: unknown): void }
  setHeader(name: string, value: string): void
}

export default async function handler(req: AiRequest, res: AiResponse): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  const result = await runAiProxy(req.body, process.env.OPENCODE_GO_API_KEY)
  res.status(result.status).json(result.json)
}
