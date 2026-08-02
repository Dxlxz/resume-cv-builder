import type { TextareaHTMLAttributes } from 'react'

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextArea({
  label,
  error,
  id,
  className = '',
  ...props
}: TextAreaProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={`min-h-28 w-full rounded-sm border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-[var(--duration-state)] focus:border-[var(--ring)] ${
          error
            ? 'border-status-danger focus:border-status-danger'
            : 'border-border'
        }`}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-status-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
