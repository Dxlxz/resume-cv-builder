import type { ResumeDocument } from '@rb/core/types/document'
import type { AiEditPlan } from '@/lib/ai/edits'

export interface ChatHistoryMessage {
  role: 'user' | 'idrizz'
  text: string
  /** Pending (not yet applied) edit plan. */
  plan?: AiEditPlan
  /** A suggestion that was applied: summary text + pre-apply snapshot. */
  applied?: {
    summary: string
    snapshot: ResumeDocument
    undone: boolean
  }
}

export type ChatHistory = ChatHistoryMessage[]

const HISTORY_KEY = 'rizzume:idrizz-chat'
const MAX_MESSAGES = 30

export function loadChatHistory(): ChatHistory {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as ChatHistory
  } catch {
    return []
  }
}

export function saveChatHistory(messages: ChatHistory): void {
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)))
  } catch {
    // private mode or blocked storage: history just stays in memory
  }
}

export function clearChatHistory(): void {
  try {
    window.localStorage.removeItem(HISTORY_KEY)
  } catch {
    // ignore
  }
}
