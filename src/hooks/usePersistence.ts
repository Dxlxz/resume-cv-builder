import { useEffect } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { startDraftPersistence } from '@/lib/draftPersistence'

/**
 * Wires the draft persistence controller to the document store. The
 * controller lives for the app's lifetime: debounced autosave, flush on
 * tab hide/unload, and cross-tab adoption of newer revisions.
 */

let controller: ReturnType<typeof startDraftPersistence> | null = null

export function usePersistence() {
  const document = useDocumentStore((s) => s.document)

  useEffect(() => {
    if (!controller) {
      controller = startDraftPersistence({
        getCurrent: () => useDocumentStore.getState().document,
        onStatus: (status, error = null) =>
          useDocumentStore.getState().setSaveStatus(status, error),
        onExternalChange: (doc) => useDocumentStore.getState().importExternalDocument(doc),
      })
    }
  }, [])

  useEffect(() => {
    if (!document) return
    controller?.schedule(document)
  }, [document])
}
