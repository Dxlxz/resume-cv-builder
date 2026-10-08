import { useCallback, useState, type ReactNode } from 'react'
import { ConfirmDialog, type ConfirmRequest } from '@/shared/ui/confirm-dialog'

/*
 * Application pattern (origin: internal): ask before a destructive action without window.confirm.
 *
 *   const { requestConfirm, confirmDialog } = useConfirm()
 *   requestConfirm({ title, description, confirmLabel, onConfirm })
 *   return <>{...}{confirmDialog}</>
 */
export function useConfirm(): { requestConfirm: (request: ConfirmRequest) => void; confirmDialog: ReactNode } {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const requestConfirm = useCallback((next: ConfirmRequest) => setRequest(next), [])
  const confirmDialog = <ConfirmDialog request={request} onClose={() => setRequest(null)} />
  return { requestConfirm, confirmDialog }
}
