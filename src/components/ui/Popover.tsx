import type { ReactNode } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

/**
 * UDS popover facade on Radix: outside-click, Esc, focus handling,
 * animated (200ms scale-in). Semantic tokens only.
 */

interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  /** Optional labelled title (aria). */
  ariaLabel?: string
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
  className?: string
  /** Controlled open state (e.g. to close after a navigation). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Popover({
  trigger,
  children,
  ariaLabel,
  align = 'end',
  sideOffset = 6,
  className = '',
  open,
  onOpenChange,
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          aria-label={ariaLabel}
          className={`z-50 max-w-[calc(100vw-2rem)] animate-pop-in rounded-md border border-border bg-card p-4 shadow-[var(--shadow-menu)] outline-none ${className}`}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
