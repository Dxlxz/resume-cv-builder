import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { useAi } from '@/hooks/useAi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { buildDocumentContext, parseAiEditPlan, type AiEditPlan } from '@/lib/ai/edits'
import { AiEditReview } from '@/components/ai/AiEditReview'
import { Button } from '@/components/ui/Button'

/**
 * Idrizz, the floating chatbot. A round bubble sits at the bottom-right of
 * the builder; it opens a chat panel with a persona: a warm, direct resume
 * wingman. Edit requests come back as typed JSON plans, reviewed inline
 * (Apply/Discard per group). Size adapts automatically to the viewport:
 * a bottom sheet on mobile, a floating panel sized to the screen on
 * desktop - no user options.
 */

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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastResultRef = useRef<string | null>(null)
  const lastErrorRef = useRef<string | null>(null)

  const hasUserMessage = messages.some((m) => m.role === 'user')

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
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
    run({ instruction: text, context: buildDocumentContext(document) })
  }

  const clearPlan = (index: number) => {
    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, plan: undefined } : m)))
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
                    setInput(preset.instruction)
                    inputRef.current?.focus()
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
    </div>
      )}
    </>
  )
}
