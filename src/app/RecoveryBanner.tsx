import { ArchiveRestoreIcon } from 'lucide-react'
import { useDocumentStore } from '@/modules/document'
import { Alert, AlertAction, AlertDescription } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

/**
 * Shown when a corrupted draft was quarantined instead of deleted. Restore
 * puts it back in the editor; discard removes the backup for good.
 */
export function RecoveryBanner() {
  const recoverableBackup = useDocumentStore((s) => s.recoverableBackup)
  const recoverBackup = useDocumentStore((s) => s.recoverBackup)
  const dismissRecovery = useDocumentStore((s) => s.dismissRecovery)

  if (!recoverableBackup) return null

  return (
    <Alert variant="warning" className="rounded-none border-x-0 border-t-0">
      <ArchiveRestoreIcon aria-hidden />
      <AlertDescription>A backup of your last draft was found after it failed to load.</AlertDescription>
      <AlertAction className="flex gap-2">
        <Button type="button" size="sm" onClick={recoverBackup}>
          Restore it
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={dismissRecovery}>
          Discard
        </Button>
      </AlertAction>
    </Alert>
  )
}
