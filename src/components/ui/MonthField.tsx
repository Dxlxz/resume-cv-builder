import type { InputHTMLAttributes } from 'react'

interface MonthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function MonthField({ label, id, className = '', ...props }: MonthFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={fieldId}
        type="month"
        className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)]"
        {...props}
      />
    </div>
  )
}
