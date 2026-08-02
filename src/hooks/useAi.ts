import { useCallback, useEffect, useRef, useState } from 'react'
import { AiError, requestAi } from '@/lib/ai/client'
import type { AiFeature } from '@/lib/ai/types'

const CONSENT_KEY = 'resume-builder:ai-consent'

export function hasAiConsent(): boolean {
  try {
    return window.localStorage.getItem(CONSENT_KEY) === '1'
  } catch {
    return false
  }
}

function grantAiConsent(): void {
  try {
    window.localStorage.setItem(CONSENT_KEY, '1')
  } catch {
    // private mode or blocked storage: AI stays unavailable for this session
  }
}

/**
 * One AI action per section. The first run shows a consent notice; after
 * acceptance, runs send the section text to the app's AI endpoint. Results
 * are never applied automatically — the caller decides via AiReview.
 */
export function useAi(feature: AiFeature) {
  const [result, setResult] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consentOpen, setConsentOpen] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const payloadRef = useRef<unknown>(null)

  const doRun = useCallback(
    async (payload: unknown) => {
      payloadRef.current = payload
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setBusy(true)
      setError(null)
      try {
        const { text } = await requestAi(feature, payload, { signal: controller.signal })
        setResult(text)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof AiError ? err.message : 'Something went wrong. Try again.')
      } finally {
        setBusy(false)
      }
    },
    [feature],
  )

  const run = useCallback(
    (payload: unknown) => {
      if (hasAiConsent()) {
        void doRun(payload)
        return
      }
      payloadRef.current = payload
      setConsentOpen(true)
    },
    [doRun],
  )

  const acceptConsent = useCallback(() => {
    grantAiConsent()
    setConsentOpen(false)
    if (payloadRef.current !== null) void doRun(payloadRef.current)
  }, [doRun])

  const declineConsent = useCallback(() => {
    setConsentOpen(false)
    payloadRef.current = null
  }, [])

  const discard = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  useEffect(() => () => abortRef.current?.abort(), [])

  return { result, busy, error, consentOpen, run, acceptConsent, declineConsent, discard }
}
