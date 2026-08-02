import { useEffect } from 'react'
import { useDocumentStore } from '@/app/store/documentStore'
import { StorageQuotaError, trySaveToStorage } from '@/lib/persistence'
import { debounce } from '@/lib/utils'

const debouncedSave = debounce((doc: NonNullable<ReturnType<typeof useDocumentStore.getState>['document']>) => {
  try {
    trySaveToStorage(doc)
    useDocumentStore.getState().setSaveStatus('saved')
  } catch (error) {
    if (error instanceof StorageQuotaError) {
      useDocumentStore
        .getState()
        .setSaveStatus('error', 'Storage full. Export a JSON backup to free space.')
    } else {
      useDocumentStore.getState().setSaveStatus('error', 'Could not save draft.')
    }
  }
}, 500)

export function usePersistence() {
  const document = useDocumentStore((s) => s.document)
  const hasStarted = useDocumentStore((s) => s.hasStarted)

  useEffect(() => {
    if (!hasStarted || !document) return
    useDocumentStore.getState().setSaveStatus('saving')
    debouncedSave(document)
  }, [document, hasStarted])
}
