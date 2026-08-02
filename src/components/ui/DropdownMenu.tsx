import type { ReactNode } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'

/**
 * UDS dropdown menu facade on Radix: keyboard nav, outside-click, Esc,
 * animated (200ms scale-in). Semantic tokens only.
 */

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

interface DropdownMenuContentProps {
  children: ReactNode
  className?: string
  align?: 'start' | 'center' | 'end'
}

export function DropdownMenuContent({
  children,
  className = '',
  align = 'end',
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={6}
        className={`z-50 min-w-60 animate-pop-in rounded-md border border-border bg-card p-1.5 shadow-[var(--shadow-menu)] ${className}`}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

interface DropdownMenuItemProps {
  children: ReactNode
  onSelect?: () => void
  disabled?: boolean
  /** Danger styling (e.g. Start fresh). */
  danger?: boolean
  className?: string
}

export function DropdownMenuItem({
  children,
  onSelect,
  disabled,
  danger = false,
  className = '',
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      disabled={disabled}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-left text-sm outline-none transition-colors duration-[var(--duration-state)] data-[highlighted]:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 ${
        danger ? 'text-status-danger data-[highlighted]:bg-badge-danger' : 'text-foreground'
      } ${className}`}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator
