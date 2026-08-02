import { useEffect, useRef, useState } from 'react'
import type { SectionId } from '@rb/core/types/document'
import { useDocumentStore } from '@/app/store/documentStore'
import { useAi } from '@/hooks/useAi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import {
  aiEditPlanHasEffects,
  buildDocumentContext,
  parseAiEditPlan,
} from '@/lib/ai/edits'
import {
  clearChatHistory,
  loadChatHistory,
  saveChatHistory,
  type ChatHistoryMessage,
} from '@/lib/ai/history'
import { scrollToFormSection } from '@/lib/scrollToSection'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { AiEditReview, type AiAppliedInfo } from '@/components/ai/AiEditReview'
import { Button } from '@/components/ui/Button'

/**
 * Idrizz, the floating chatbot. A round bubble sits at the bottom-right of
 * the builder; it opens a chat panel with a persona: a warm, direct resume
 * wingman. Edit requests come back as typed JSON plans, reviewed inline
 * (Apply/Discard per group). Applied plans become "Applied" cards with
 * Undo, and the thread persists across reloads (localStorage, capped).
 * Size adapts automatically to the viewport: a bottom sheet on mobile, a
 * floating panel sized to the screen on desktop - no user options.
 */

const PRESETS: { label: string; instruction: string; instant?: boolean }[] = [
  {
    label: 'Rewrite my summary',
    instruction: 'Rewrite my professional summary to be tighter and more persuasive.',
    instant: true,
  },
  {
    label: 'Improve my bullets',
    instruction:
      'Improve the bullet points across my experience: stronger verbs, measurable outcomes, no invented facts.',
    instant: true,
  },
  {
    label: 'Tailor to a job',
    instruction: 'Tailor my document to this job description:\n\n',
  },
]

const CAPABILITIES = [
  'Rewrite and tighten sections to sound stronger',
  'Sharpen bullet points with measurable outcomes',
  'Tailor your document to a job description',
]

function SparkleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" />
      <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
    </svg>
  )
}

type ChatMessage = ChatHistoryMessage

interface IdrizzChatProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export function IdrizzChat({ open, onOpen, onClose }: IdrizzChatProps) {
  const document = useDocumentStore((s) => s.document)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { result, busy, error, consentOpen, run, acceptConsent, declineConsent } = useAi('ai-edit')
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatHistory())
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastResultRef = useRef<string | null>(null)
  const lastErrorRef = useRef<string | null>(null)
  const documentRef = useRef(document)

  useEffect(() => {
    documentRef.current = document
  }, [document])

  const hasUserMessage = messages.some((m) => m.role === 'user')

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, consentOpen])

  // A section-scoped "Rewrite this section" request arrives through the
  // store (idrizzPrefill). Consumed on the store subscription - the
  // recommended external-system pattern - so it goes through the normal
  // send flow, consent gate included.
  useEffect(() => {
    return useDocumentStore.subscribe((state, prev) => {
      if (!state.idrizzOpen || !state.idrizzPrefill) return
      if (state.idrizzPrefill === prev.idrizzPrefill) return
      const text = state.idrizzPrefill
      useDocumentStore.getState().setIdrizzPrefill(null)
      const doc = documentRef.current
      if (!doc) return
      setMessages((prevMessages) => [...prevMessages, { role: 'user', text }])
      let context: string
      try {
        context = buildDocumentContext(doc)
      } catch {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            role: 'idrizz',
            text: 'Your document is too large for Idrizz right now. Ask about one section at a time, or trim some bullets.',
          },
        ])
        return
      }
      run({ instruction: text, context })
    })
  }, [run])

  useEffect(() => {
    if (result === null || result === lastResultRef.current) return
    lastResultRef.current = result
    const plan = parseAiEditPlan(result)
    if (plan && aiEditPlanHasEffects(plan)) {
      // The AI result is an external-system event; appending it to the
      // thread is the only way to reflect it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages((prev) => [
        ...prev,
        {
          role: 'idrizz',
          text: 'Nih cadangan saya. Check dulu, apply mana yang ok:',
          plan,
        },
      ])
      return
    }
    setMessages((prev) => [
      ...prev,
      plan
        ? {
            role: 'idrizz',
            text: 'Idrizz tak jumpa apa-apa yang patut diubah untuk permintaan tu. Cuba lebih spesifik, contohnya "Kemas summary aku jadi 3 ayat".',
          }
        : {
            role: 'idrizz',
            text: 'Hmm, tak jadi nak jadikan edits. Cuba ayat lain, atau bagi lebih detail.',
          },
    ])
  }, [result])

  useEffect(() => {
    if (!error || error === lastErrorRef.current) return
    lastErrorRef.current = error
    setMessages((prev) => [...prev, { role: 'idrizz', text: `${error} Try lagi?` }])
  }, [error])

  // Persist the thread so reloads keep full session context.
  useEffect(() => {
    saveChatHistory(messages)
  }, [messages])

  if (!document) return null

  const send = (textOverride?: string) => {
    const text = (textOverride ?? input).trim()
    if (!text || busy) return
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    let context: string
    try {
      context = buildDocumentContext(document)
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'idrizz',
          text: 'Your document is too large for Idrizz right now. Ask about one section at a time, or trim some bullets.',
        },
      ])
      return
    }
    run({ instruction: text, context })
  }

  const clearPlan = (index: number) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, plan: undefined } : m)))
  }

  const handleApplied = (index: number, info: AiAppliedInfo) => {
    setMessages((prev) =>
      prev.map((m, i) => {
        if (i !== index || !m.plan) return m
        const first = !m.applied
        const snapshot =
          first && info.snapshot
            ? info.snapshot
            : m.applied?.snapshot ?? useDocumentStore.getState().document
        if (!snapshot) return m
        const summary = m.applied
          ? `${m.applied.summary} · ${info.summary}`
          : info.key === 'all'
            ? 'All suggestions applied'
            : info.summary
        return { ...m, applied: { summary, snapshot, undone: false } }
      }),
    )
  }

  const undoApplied = (index: number) => {
    const message = messages[index]
    if (!message?.applied || message.applied.undone || !message.applied.snapshot) return
    useDocumentStore.getState().setDocument(message.applied.snapshot)
    setMessages((prev) =>
      prev.map((m, i) =>
        i === index && m.applied ? { ...m, applied: { ...m.applied, undone: true } } : m,
      ),
    )
  }

  const newChat = () => {
    clearChatHistory()
    setMessages([])
    setInput('')
  }

  const firstSectionOf = (message: ChatMessage): SectionId | null => {
    if (!message.plan) return null
    const plan = message.plan
    const order: (keyof typeof plan)[] = [
      'summary',
      'experience',
      'education',
      'certifications',
      'skills',
      'projects',
      'volunteer',
      'references',
      'sections',
    ]
    for (const key of order) {
      if (plan[key] !== undefined) {
        if (key === 'sections') return 'summary'
        return key as SectionId
      }
    }
    return null
  }

  const sectionLabelOf = (message: ChatMessage): string => {
    const section = firstSectionOf(message)
    return section ? getSectionLabel(section, {}) : 'section'
  }

  return (
    <>
      <button
        type="button"
        onClick={open ? onClose : onOpen}
        aria-label={open ? 'Close chat' : 'Chat with Idrizz'}
        title={open ? 'Close chat' : 'Chat with Idrizz'}
        className={`fixed bottom-5 right-5 z-50 flex h-12 w-12 animate-pop-in items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-modal)] transition-all duration-[var(--duration-state)] hover:scale-105 active:scale-95 ${
          open ? 'bg-foreground' : 'bg-primary'
        }`}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <SparkleIcon />
        )}
      </button>

      {open && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Idrizz"
      className={
        isMobile
          ? 'fixed inset-x-0 bottom-0 z-40 flex h-[min(85dvh,100dvh)] animate-chat-in flex-col overflow-hidden rounded-t-lg border border-b-0 border-border bg-card shadow-[var(--shadow-modal)]'
          : 'fixed bottom-20 right-5 z-40 flex h-[min(32rem,calc(100dvh-7rem))] w-[min(25rem,calc(100vw-2rem))] animate-chat-in flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-modal)]'
      }
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-header px-3 py-2.5">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
          <SparkleIcon size={16} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-header bg-status-success" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-foreground">Idrizz</p>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {hasUserMessage ? 'Your resume wingman' : 'Starting conversation…'}
          </p>
        </div>
        {hasUserMessage && (
          <button
            type="button"
            onClick={newChat}
            title="Start a new chat (clears this thread)"
            aria-label="Start a new chat"
            className="rounded-sm px-2 py-1 text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted hover:text-foreground"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-sm px-2 py-1 text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted hover:text-foreground"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {!hasUserMessage && !consentOpen && (
          <div className="animate-slide-up rounded-lg border border-border bg-muted p-4">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"
              aria-hidden
            >
              <SparkleIcon size={18} />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-foreground">
              Hi, I&apos;m Idrizz — your resume wingman
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Tolong aku kemas resume kau — English atau Bahasa Melayu pun boleh.
            </p>
            <ul className="mt-3 space-y-1.5">
              {CAPABILITIES.map((capability) => (
                <li key={capability} className="flex items-start gap-2 text-sm text-foreground">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-0.5 shrink-0 text-status-success"
                    aria-hidden
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-foreground transition-colors duration-[var(--duration-state)] hover:text-primary"
                  onClick={() => {
                    if (preset.instant) {
                      send(preset.instruction)
                    } else {
                      setInput(preset.instruction)
                      inputRef.current?.focus()
                    }
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) =>
          message.plan || message.applied ? (
            <div key={index} className="animate-slide-up space-y-2">
              <p className="text-sm font-medium text-foreground">{message.text}</p>
              {message.applied && (
                <div
                  className={`rounded-md border px-3 py-2 text-sm ${
                    message.applied.undone
                      ? 'border-border bg-muted text-muted-foreground'
                      : 'border-status-success/30 bg-badge-success text-status-success-foreground'
                  }`}
                >
                  <p className="font-medium">
                    {message.applied.undone ? 'Undone — changes reverted' : `✓ Applied — ${message.applied.summary}`}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {!message.applied.undone && (
                      <button
                        type="button"
                        onClick={() => undoApplied(index)}
                        className="rounded-full border border-border/60 px-2 py-0.5 text-xs transition-colors duration-[var(--duration-state)] hover:bg-card/60"
                      >
                        Undo
                      </button>
                    )}
                    {!message.applied.undone && (
                      <button
                        type="button"
                        onClick={() => {
                          const section = firstSectionOf(message)
                          if (section) scrollToFormSection(section)
                        }}
                        className="rounded-full border border-border/60 px-2 py-0.5 text-xs transition-colors duration-[var(--duration-state)] hover:bg-card/60"
                      >
                        Go to {sectionLabelOf(message)}
                      </button>
                    )}
                  </div>
                </div>
              )}
              {message.plan && (
                <div>
                  <AiEditReview
                    plan={message.plan}
                    onDiscard={() => clearPlan(index)}
                    onApplied={(info) => handleApplied(index, info)}
                  />
                </div>
              )}
            </div>
          ) : (
            <div
              key={index}
              className={`animate-slide-up ${
                message.role === 'user' ? 'flex justify-end' : 'flex justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-muted text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
              </div>
            </div>
          ),
        )}

        {busy && (
          <div className="flex animate-slide-up justify-start">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
              <span className="rb-typing-dot h-1.5 w-1.5 rounded-full bg-foreground/60" />
              <span
                className="rb-typing-dot h-1.5 w-1.5 rounded-full bg-foreground/60"
                style={{ animationDelay: '0.2s' }}
              />
              <span
                className="rb-typing-dot h-1.5 w-1.5 rounded-full bg-foreground/60"
                style={{ animationDelay: '0.4s' }}
              />
              <span className="ml-1.5">Idrizz tengah fikir...</span>
            </div>
          </div>
        )}

        {consentOpen && (
          <div className="animate-slide-up rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
            <p className="font-semibold">Sebelum Idrizz mula</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Instruction dan teks dokumen kau akan dihantar ke servis AI luar (OpenCode Go,
              DeepSeek). Tak disimpan, tak digunakan untuk training. OK?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={acceptConsent}>
                OK, teruskan
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={declineConsent}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="shrink-0 border-t border-border bg-header p-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Start a conversation… e.g. &quot;Tighten my summary&quot;"
            className="min-h-10 flex-1 resize-none rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
          />
          <button
            type="button"
            onClick={() => send()}
            disabled={busy || !input.trim()}
            aria-label="Send to Idrizz"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity duration-[var(--duration-state)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 19V5" />
              <path d="M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
      )}
    </>
  )
}
