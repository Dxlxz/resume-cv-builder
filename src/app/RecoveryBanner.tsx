import { useDocumentStore } from '@/app/store/documentStore'

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
    <div className="border-b border-status-warning/30 bg-badge-warning px-4 py-2 text-sm text-status-warning-foreground">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-1">
        <span>A backup of your last draft was found after it failed to load.</span>
        <button
          type="button"
          className="font-medium underline transition-colors duration-[var(--duration-state)] hover:opacity-80"
          onClick={recoverBackup}
        >
          Restore it
        </button>
        <button
          type="button"
          className="underline transition-colors duration-[var(--duration-state)] hover:opacity-80"
          onClick={dismissRecovery}
        >
          Discard
        </button>
      </div>
    </div>
  )
}
