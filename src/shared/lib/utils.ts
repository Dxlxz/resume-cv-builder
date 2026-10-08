export function sanitizeFilename(name: string): string {
  const sanitized = name
    .trim()
    .replace(/[^a-z0-9-_]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return sanitized || 'document'
}

export interface Debounced<F extends (...args: never[]) => void> {
  (...args: Parameters<F>): void
  cancel(): void
}

export function debounce<F extends (...args: never[]) => void>(fn: F, delay: number): Debounced<F> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const debounced = ((...args: Parameters<F>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as Debounced<F>
  debounced.cancel = () => {
    clearTimeout(timer)
    timer = undefined
  }
  return debounced
}

export const MAX_IMPORT_BYTES = 1_000_000

export function isBrowserSupported(): boolean {
  try {
    if (typeof window === 'undefined') return true
    if (typeof localStorage === 'undefined') return false
    const testKey = '__resume_builder_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return typeof Blob !== 'undefined'
  } catch {
    return false
  }
}
