import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog'
import { buttonVariants } from '@/shared/ui/button'

/*
 * Application pattern (origin: internal) over the shadcn AlertDialog: one way to ask before a
 * destructive or replacing action. Replaces window.confirm so focus, Escape, scroll lock and
 * restoration come from the dialog primitive (Gold Standard hybrid-shadcn-reui section 30).
 */

export interface ConfirmRequest {
  title: string
  description: ReactNode
  confirmLabel: string
  /** Style the confirm button as destructive. */
  destructive?: boolean
  onConfirm: () => void
}

interface ConfirmDialogProps {
  request: ConfirmRequest | null
  onClose: () => void
}

export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  return (
    <AlertDialog open={request !== null} onOpenChange={(open) => !open && onClose()}>
      {request && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{request.title}</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">{request.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={request.destructive ? buttonVariants({ variant: 'destructive' }) : undefined}
              onClick={() => {
                request.onConfirm()
                onClose()
              }}
            >
              {request.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}
