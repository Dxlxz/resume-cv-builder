import { describe, expect, it } from 'vitest'
import { buildAiEditMessages } from '@/lib/ai/prompts'

describe('buildAiEditMessages', () => {
  it('builds a system prompt with the writing rules and JSON contract', () => {
    const messages = buildAiEditMessages({
      instruction: 'Rewrite my summary.',
      context: '{"summary":"x"}',
    })
    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toContain('British English')
    expect(messages[0].content).toContain('Never use em dashes or en dashes')
    expect(messages[0].content).toContain('"experience"')
    expect(messages[0].content).toContain('"sections"')
    expect(messages[0].content).toContain('Never invent ids')
  })

  it('passes the instruction and document context to the model', () => {
    const messages = buildAiEditMessages({
      instruction: 'Tailor to this job:\nNeed a React engineer.',
      context: '{"summary":"A dev.","experience":[]}',
    })
    const user = messages[1].content
    expect(user).toContain('Tailor to this job:')
    expect(user).toContain('Need a React engineer.')
    expect(user).toContain('{"summary":"A dev.","experience":[]}')
  })
})
