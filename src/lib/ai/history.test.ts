import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
  type ChatHistoryMessage,
} from '@/lib/ai/history'
import { createEmptyDocument } from '@rb/presets/createDocument'
import type { ResumeDocument } from '@rb/core/types/document'

function doc(): ResumeDocument {
  const base = createEmptyDocument('resume')
  return { ...base, summary: 'A dev.' }
}

describe('chat history persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('round-trips messages including pending plans and applied snapshots', () => {
    const messages: ChatHistoryMessage[] = [
      { role: 'user', text: 'Tighten my summary.' },
      { role: 'idrizz', text: 'Nih cadangan saya.', plan: { summary: 'Tighter.' } },
      {
        role: 'idrizz',
        text: 'Nih cadangan saya.',
        applied: { summary: 'Summary rewritten', snapshot: doc(), undone: false },
      },
    ]
    saveChatHistory(messages)
    const loaded = loadChatHistory()
    expect(loaded).toHaveLength(3)
    expect(loaded[1].plan).toEqual({ summary: 'Tighter.' })
    expect(loaded[2].applied?.summary).toBe('Summary rewritten')
    expect(loaded[2].applied?.snapshot.summary).toBe('A dev.')
  })

  it('caps at the last 30 messages', () => {
    const messages: ChatHistoryMessage[] = Array.from({ length: 40 }, (_, i) => ({
      role: 'user',
      text: `m${i}`,
    }))
    saveChatHistory(messages)
    const loaded = loadChatHistory()
    expect(loaded).toHaveLength(30)
    expect(loaded[0].text).toBe('m10')
  })

  it('returns empty on missing or corrupt storage', () => {
    expect(loadChatHistory()).toEqual([])
    window.localStorage.setItem('rizzume:idrizz-chat', '{not json')
    expect(loadChatHistory()).toEqual([])
  })

  it('clears the stored history', () => {
    saveChatHistory([{ role: 'user', text: 'x' }])
    clearChatHistory()
    expect(loadChatHistory()).toEqual([])
  })
})
