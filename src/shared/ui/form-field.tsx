import { useId, type ComponentProps, type ReactNode } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'

/*
 * Application pattern (origin: internal) over the shadcn Field + Input/Textarea primitives.
 * One interaction grammar for every data-entry control (Gold Standard forms-editors):
 *   - the label is always visible and bound to the control;
 *   - required is shown as text for assistive technology as well as an asterisk;
 *   - an error has a visual signal, a text explanation and a programmatic association
 *     (aria-invalid + aria-describedby), never a red border alone.
 */

interface FieldFrameProps {
  label: string
  /** Field-level error text; explain how to fix it, not just that it failed. */
  error?: string
  /** Optional help text, associated with the control. */
  description?: ReactNode
  required?: boolean
  className?: string
  fieldId: string
  children: ReactNode
}

function FieldFrame({ label, error, description, required, className, fieldId, children }: FieldFrameProps) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={fieldId}>
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-destructive">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </FieldLabel>
      {children}
      {description && <FieldDescription id={`${fieldId}-description`}>{description}</FieldDescription>}
      {error && <FieldError id={`${fieldId}-error`}>{error}</FieldError>}
    </Field>
  )
}

const describedBy = (fieldId: string, error?: string, description?: ReactNode) =>
  [description ? `${fieldId}-description` : null, error ? `${fieldId}-error` : null].filter(Boolean).join(' ') || undefined

type FieldOwnProps = { label: string; error?: string; description?: ReactNode }

export function TextField({
  label,
  error,
  description,
  id,
  className,
  required,
  ...props
}: FieldOwnProps & ComponentProps<'input'>) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldFrame label={label} error={error} description={description} required={required} className={className} fieldId={fieldId}>
      <Input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, description)}
        {...props}
      />
    </FieldFrame>
  )
}

export function TextAreaField({
  label,
  error,
  description,
  id,
  className,
  required,
  ...props
}: FieldOwnProps & ComponentProps<'textarea'>) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldFrame label={label} error={error} description={description} required={required} className={className} fieldId={fieldId}>
      <Textarea
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, description)}
        className="min-h-24"
        {...props}
      />
    </FieldFrame>
  )
}

export function MonthField({
  label,
  error,
  description,
  id,
  className,
  required,
  ...props
}: FieldOwnProps & Omit<ComponentProps<'input'>, 'type'>) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <FieldFrame label={label} error={error} description={description} required={required} className={className} fieldId={fieldId}>
      <Input
        id={fieldId}
        type="month"
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, description)}
        {...props}
      />
    </FieldFrame>
  )
}
