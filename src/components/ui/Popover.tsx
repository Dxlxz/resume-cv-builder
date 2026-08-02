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
}

export function Popover({
  trigger,
  children,
  ariaLabel,
  align = 'end',
  sideOffset = 6,
  className = '',
}: PopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={sideOffset}
          aria-label={ariaLabel}
          className={`z-50 animate-pop-in rounded-md border border-border bg-card p-4 shadow-[var(--shadow-menu)] outline-none ${className}`}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
