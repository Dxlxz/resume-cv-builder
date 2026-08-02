import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { useAi } from '@/hooks/useAi'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { buildDocumentContext, parseAiEditPlan, type AiEditPlan } from '@/lib/ai/edits'
import { IdrizzIconButton } from '@/components/ai/IdrizzIconButton'
import { AiEditReview } from '@/components/ai/AiEditReview'
import { Button } from '@/components/ui/Button'

/**
 * Idrizz, the floating chatbot. A round bubble sits at the bottom-right of
 * the builder; it opens a chat panel with a persona: a warm, direct resume
 * wingman. Edit requests come back as typed JSON plans, reviewed inline
 * (Apply/Discard per group).
 */

const PRESETS: { label: string; instruction: string }[] = [
  {
    label: 'Rewrite my summary',
    instruction: 'Rewrite my professional summary to be tighter and more persuasive.',
  },
  {
    label: 'Improve my bullets',
    instruction:
      'Improve the bullet points across my experience: stronger verbs, measurable outcomes, no invented facts.',
  },
  {
    label: 'Tailor to a job',
    instruction: 'Tailor my document to this job description:\n\n',
  },
]

const WELCOME =
  'Hi! I am Idrizz, your resume wingman. Tell me what to edit, add, or remove, or pick a shortcut below. English atau Bahasa Melayu pun boleh.'

interface ChatMessage {
  role: 'user' | 'idrizz'
  text: string
  plan?: AiEditPlan
}

interface IdrizzChatProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
  /** Instruction to prefill (from a section's Idrizz icon). */
  prefillInstruction?: string
  /** Changes every time a new prefill is requested. */
  prefillNonce?: number
}

export function IdrizzChat({
  open,
  onOpen,
  onClose,
  prefillInstruction = '',
  prefillNonce = 0,
}: IdrizzChatProps) {
  const document = useDocumentStore((s) => s.document)
  const { result, busy, error, consentOpen, run, acceptConsent, declineConsent } = useAi('ai-edit')
  const { size, onPointerDown } = useResizablePanel({
    defaultSize: { width: 384, height: 512 },
    minWidth: 288,
    maxWidth: 448,
    minHeight: 320,
    maxHeight: 640,
    storageKey: 'rizzume-idrizz-size',
  })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [started, setStarted] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const initialisedRef = useRef(false)
  const lastResultRef = useRef<string | null>(null)
  const lastErrorRef = useRef<string | null>(null)

  useEffect(() => {
    if (open && !initialisedRef.current) {
      initialisedRef.current = true
      setMessages([{ role: 'idrizz', text: WELCOME }])
    }
  }, [open])

  // New prefill request: load it into the input (render-time adjustment,
  // own state only, keyed by nonce).
  const [prevNonce, setPrevNonce] = useState(prefillNonce)
  if (open && prefillInstruction && prefillNonce !== prevNonce) {
    setPrevNonce(prefillNonce)
    setInput(prefillInstruction)
  }

  useEffect(() => {
    if (open && prefillInstruction) inputRef.current?.focus()
  }, [open, prefillInstruction])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy, consentOpen])

  useEffect(() => {
    if (result === null || result === lastResultRef.current) return
    lastResultRef.current = result
    const plan = parseAiEditPlan(result)
    setMessages((prev) => [
      ...prev,
      plan
        ? { role: 'idrizz', text: 'Nih cadangan saya. Check dulu, apply mana yang ok:', plan }
        : { role: 'idrizz', text: 'Hmm, tak jadi nak jadikan edits. Cuba ayat lain, atau bagi lebih detail.' },
    ])
  }, [result])

  useEffect(() => {
    if (!error || error === lastErrorRef.current) return
    lastErrorRef.current = error
    setMessages((prev) => [...prev, { role: 'idrizz', text: `${error} Try lagi?` }])
  }, [error])

  if (!document) return null

  const send = () => {
    const text = input.trim()
    if (!text || busy) return
    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setStarted(true)
    run({ instruction: text, context: buildDocumentContext(document) })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Chat with Idrizz"
        title="Chat with Idrizz"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-modal)] transition-transform duration-[var(--duration-state)] hover:scale-105"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" />
          <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
        </svg>
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Idrizz"
      className="fixed bottom-20 right-5 z-40 flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-modal)]"
      style={{
        width: size.width,
        height: size.height,
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100dvh - 7rem)',
      }}
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-header px-3 py-2.5">
        <IdrizzIconButton size="md" onClick={() => inputRef.current?.focus()} label="Idrizz" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-foreground">Idrizz</p>
          <p className="text-xs text-muted-foreground">Your resume wingman</p>
        </div>
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
        {messages.map((message, index) => (
          <div key={index} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[85%] rounded-md px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
              {message.plan && (
                <div className="mt-3">
                  <AiEditReview
                    plan={message.plan}
                    onDiscard={() =>
                      setMessages((prev) =>
                        prev.map((m, i) => (i === index ? { ...m, plan: undefined } : m)),
                      )
                    }
                    onApplied={() =>
                      setMessages((prev) =>
                        prev.map((m, i) => (i === index ? { ...m, plan: undefined } : m)),
                      )
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden />
              Idrizz tengah fikir...
            </div>
          </div>
        )}

        {consentOpen && (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
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

        {!started && !consentOpen && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground transition-colors duration-[var(--duration-state)] hover:text-foreground"
                onClick={() => {
                  setInput(preset.instruction)
                  setStarted(true)
                  inputRef.current?.focus()
                }}
              >
                {preset.label}
              </button>
            ))}
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
            placeholder="Edit, tambah, buang... apa sahaja."
            className="min-h-10 flex-1 resize-none rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
          />
          <button
            type="button"
            onClick={send}
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

      <div
        role="separator"
        aria-label="Resize chat"
        aria-orientation="horizontal"
        onPointerDown={onPointerDown}
        className="absolute bottom-0 right-0 flex h-5 w-5 cursor-nwse-resize touch-none items-end justify-end p-1 text-muted-foreground/60 transition-colors duration-[var(--duration-state)] hover:text-muted-foreground"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M22 14v8h-8l8-8z" />
          <path d="M22 2v6L16 2h6zM2 22v-8l8 8H2z" />
        </svg>
      </div>
    </div>
  )
}
