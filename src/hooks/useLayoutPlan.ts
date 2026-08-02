import { useEffect, useRef, useState } from 'react'
import type { ResumeDocument } from '@rb/core/types/document'
import { computeLayoutPlan } from '@rb/layout/computeLayoutPlan'
import type { LayoutPlanResult } from '@rb/layout/types'
import { useDocumentStore } from '@/app/store/documentStore'
import { getPreset } from '@rb/presets/registry'

const DEBOUNCE_MS = 300

export function useLayoutPlan(document: ResumeDocument | null, contentKey: string) {
  const setLayoutPlan = useDocumentStore((s) => s.setLayoutPlan)
  const [plan, setPlan] = useState<LayoutPlanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  // Render-time reset: clearing local plan state when the document is gone
  // must not run as a synchronous effect (cascading render).
  if (!document && plan !== null) {
    setPlan(null)
  }

  useEffect(() => {
    if (!document) {
      setLayoutPlan(null)
      return
    }

    const current = ++requestId.current
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      const presetLabels = getPreset(document.meta.presetId).labels
      void computeLayoutPlan(document, presetLabels)
        .then((result) => {
          if (cancelled || current !== requestId.current) return
          setPlan(result)
          setLayoutPlan(result)
        })
        .finally(() => {
          if (!cancelled && current === requestId.current) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [document, contentKey, setLayoutPlan])

  return { plan, loading }
}
