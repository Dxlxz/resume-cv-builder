import { useEffect, useState } from 'react'
import type { ResumeDocument, TemplateId } from '@rb/core/types/document'
import { getPreset } from '@rb/presets/registry'
import { themeForDocument } from '@rb/themes/registry'
import { generatePdf } from '@/modules/pdf'

export type ThumbnailState = { status: 'loading' } | { status: 'ready'; blob: Blob } | { status: 'error' }

/** Finished thumbnails, kept so reopening the gallery for an unchanged draft is instant. Bounded. */
const cache = new Map<string, Blob>()
const CACHE_LIMIT = 24
/** Renders already running, so closing and reopening the gallery never starts the same template twice. */
const inflight = new Map<string, Promise<Blob>>()

const keyFor = (document: ResumeDocument, templateId: TemplateId) =>
  [templateId, document.meta.presetId, document.meta.themeId, document.meta.updatedAt].join('|')

/** The user's own document, shown in another template (and the theme that goes with it). */
export function documentInTemplate(document: ResumeDocument, templateId: TemplateId): ResumeDocument {
  return {
    ...document,
    meta: {
      ...document.meta,
      templateId,
      themeId: themeForDocument(templateId, document.meta.documentType, document.meta.themeId),
    },
  }
}

/**
 * Makes one PDF per template from the open document, one at a time and only while `enabled`, so the gallery opens at once
 * and the page stays responsive. Page 1 of each result is what a card shows.
 */
export function useTemplateThumbnails(
  document: ResumeDocument | null,
  templateIds: TemplateId[],
  enabled: boolean,
): Record<string, ThumbnailState> {
  const [done, setDone] = useState<Record<string, ThumbnailState>>({})
  // Key on the ids, not the array, so a caller that builds the list inline does not restart the queue every render.
  const idsKey = templateIds.join(',')

  useEffect(() => {
    if (!enabled || !document) return
    let cancelled = false
    const labels = getPreset(document.meta.presetId).labels
    // Drop results for older revisions of the draft, so edits do not pile up finished PDFs.
    const current = (prev: Record<string, ThumbnailState>) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => k.endsWith(`|${document.meta.updatedAt}`)))
    const queue = idsKey.split(',') as TemplateId[]
    void (async () => {
      for (const templateId of queue) {
        if (cancelled) return
        const key = keyFor(document, templateId)
        const cached = cache.get(key)
        if (cached) {
          setDone((prev) => ({ ...prev, [key]: { status: 'ready', blob: cached } }))
          continue
        }
        try {
          // The layout measure renders into a hidden DOM with flushSync, which React forbids while it is still
          // committing the effect that started us. Yield first.
          await new Promise((resolve) => setTimeout(resolve, 0))
          if (cancelled) return
          let pending = inflight.get(key)
          if (!pending) {
            pending = generatePdf(documentInTemplate(document, templateId), labels).finally(() => inflight.delete(key))
            inflight.set(key, pending)
          }
          const blob = await pending
          if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
          cache.set(key, blob)
          if (!cancelled) setDone((prev) => ({ ...current(prev), [key]: { status: 'ready', blob } }))
        } catch {
          if (!cancelled) setDone((prev) => ({ ...current(prev), [key]: { status: 'error' } }))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [document, idsKey, enabled])

  const result: Record<string, ThumbnailState> = {}
  for (const templateId of templateIds) {
    result[templateId] = (document && done[keyFor(document, templateId)]) || { status: 'loading' }
  }
  return result
}

/** For tests. */
export function clearThumbnailCache() {
  cache.clear()
  inflight.clear()
}
