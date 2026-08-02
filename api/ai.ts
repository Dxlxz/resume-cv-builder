/**
 * Vercel serverless function: POST /api/ai
 * Body: { feature: 'ai-edit', payload: { instruction, context } }
 *
 * Thin handler over the canonical proxy in ai-impl.ts (shared with the
 * Vite dev middleware). Extension-less relative import - Vercel compiles
 * each api/*.ts file standalone, so .ts specifiers would not resolve.
 * The API key is read from the OPENCODE_GO_API_KEY environment variable
 * only - it never ships in the client bundle. Stateless: no logging of
 * payloads, no storage.
 */
import { runAiProxy } from './ai-impl'

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
