import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

/**
 * UDS dialog facade on Radix: focus trap, Esc, scroll lock, animated
 * overlay (300ms) and panel (200ms). Semantic tokens only.
 */

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

interface DialogContentProps {
  children: ReactNode
  /** Fullscreen variant (e.g. the PDF preview modal). */
  fullscreen?: boolean
  className?: string
}

export function DialogContent({ children, fullscreen = false, className = '' }: DialogContentProps) {
  const surface = fullscreen
    ? 'inset-0 rounded-none border-0 shadow-none'
    : 'left-1/2 top-1/2 max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg'

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 animate-overlay-in bg-foreground/40" />
      <DialogPrimitive.Content
        className={`fixed z-50 flex flex-col border border-border bg-card shadow-[var(--shadow-modal)] outline-none ${surface} ${className}`}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description
export const DialogClose = DialogPrimitive.Close
