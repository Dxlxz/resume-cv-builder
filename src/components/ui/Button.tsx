import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs min-h-8', // --control-sm
  md: 'px-4 py-2 text-sm min-h-10', // --control-md
}

/* UDS semantics: primary = --primary action, secondary = card + border,
   ghost = muted hover, danger = --destructive. Focus ring is global. */
const variants = {
  primary:
    'bg-primary text-primary-foreground border-transparent hover:bg-primary-hover',
  secondary:
    'bg-card text-foreground border-border hover:bg-muted',
  ghost: 'bg-transparent text-foreground border-transparent hover:bg-muted',
  danger: 'bg-destructive text-destructive-foreground border-transparent hover:bg-destructive/90',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-sm border font-medium transition-all duration-[var(--duration-state)] hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
