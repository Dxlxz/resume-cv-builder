import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { useAi } from '@/hooks/useAi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useResizablePanel } from '@/hooks/useResizablePanel'
import { buildDocumentContext, parseAiEditPlan, type AiEditPlan } from '@/lib/ai/edits'
import { AiEditReview } from '@/components/ai/AiEditReview'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'

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

function SparkleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2z" />
      <path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9L19 15z" />
    </svg>
  )
}

interface ChatMessage {
  role: 'user' | 'idrizz'
  text: string
  plan?: AiEditPlan
}

interface IdrizzChatProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export function IdrizzChat({ open, onOpen, onClose }: IdrizzChatProps) {
  const document = useDocumentStore((s) => s.document)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const { result, busy, error, consentOpen, run, acceptConsent, declineConsent } = useAi('ai-edit')
  const { size, onPointerDown, setSize } = useResizablePanel({
    defaultSize: { width: 384, height: 512 },
    minWidth: 288,
    maxWidth: 448,
    minHeight: 320,
    maxHeight: 640,
    storageKey: 'rizzume-idrizz-size',
  })
  const [expanded, setExpanded] = useState(false)
  const lastSizeRef = useRef(size)
  useEffect(() => {
    if (!expanded) lastSizeRef.current = size
  }, [size, expanded])
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

  const clearPlan = (index: number) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, plan: undefined } : m)))
  }

  const toggleExpand = () => {
    if (expanded) {
      setExpanded(false)
      setSize(lastSizeRef.current)
    } else {
      setExpanded(true)
      setSize({
        width: Math.min(720, window.innerWidth - 32),
        height: Math.min(640, window.innerHeight - 112),
      })
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label="Chat with Idrizz"
        title="Chat with Idrizz"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 animate-pop-in items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-modal)] transition-all duration-[var(--duration-state)] hover:scale-105 active:scale-95"
      >
        <SparkleIcon />
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chat with Idrizz"
      className={
        isMobile
          ? 'fixed inset-x-0 bottom-0 z-40 flex h-[min(85dvh,100dvh)] animate-chat-in flex-col overflow-hidden rounded-t-lg border border-b-0 border-border bg-card shadow-[var(--shadow-modal)]'
          : 'fixed bottom-20 right-5 z-40 flex animate-chat-in flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-modal)]'
      }
      style={
        isMobile
          ? undefined
          : {
              width: size.width,
              height: size.height,
              maxWidth: 'calc(100vw - 2rem)',
              maxHeight: 'calc(100dvh - 7rem)',
            }
      }
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-header px-3 py-2.5">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
          <SparkleIcon size={16} />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-header bg-status-success" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-foreground">Idrizz</p>
          <p className="text-xs text-muted-foreground">Your resume wingman</p>
        </div>
        {!isMobile && (
          <Tooltip label={expanded ? 'Restore chat size' : 'Expand chat'}>
            <button
              type="button"
              onClick={toggleExpand}
              aria-label={expanded ? 'Restore chat size' : 'Expand chat'}
              className="rounded-sm px-2 py-1 text-muted-foreground transition-colors duration-[var(--duration-state)] hover:bg-muted hover:text-foreground"
            >
              {expanded ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M8 4v4H4M16 4v4h4M20 16h-4v4M4 16h4v4" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />
                </svg>
              )}
            </button>
          </Tooltip>
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
        {messages.map((message, index) =>
          message.plan ? (
            <div key={index} className="animate-slide-up">
              <p className="text-sm font-medium text-foreground">{message.text}</p>
              <div className="mt-2">
                <AiEditReview
                  plan={message.plan}
                  onDiscard={() => clearPlan(index)}
                  onApplied={() => clearPlan(index)}
                />
              </div>
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

      {!isMobile && (
        <div
          role="separator"
          aria-label="Drag to resize"
          aria-orientation="horizontal"
          title="Drag to resize"
          onPointerDown={onPointerDown}
          className="absolute bottom-0 left-0 flex h-5 w-5 cursor-nesw-resize touch-none items-start justify-start p-1 text-muted-foreground/50 transition-colors duration-[var(--duration-state)] hover:text-muted-foreground"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M5 19L19 5" />
            <path d="M9 19L19 9" />
            <path d="M13 19L19 13" />
          </svg>
        </div>
      )}
    </div>
  )
}
