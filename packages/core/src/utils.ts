export function createId(): string {
  return crypto.randomUUID()
}

export function formatMonthYear(value?: string): string {
  if (!value) return ''
  const [year, month] = value.split('-')
  if (!year || !month) return value
  const date = new Date(Number(year), Number(month) - 1)
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export function formatDateRange(
  start?: string,
  end?: string,
  present?: boolean,
): string {
  const startLabel = formatMonthYear(start)
  const endLabel = present ? 'Present' : formatMonthYear(end)
  if (!startLabel && !endLabel) return ''
  if (!startLabel) return endLabel
  if (!endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
}
