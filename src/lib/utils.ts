export function sanitizeFilename(name: string): string {
  const sanitized = name
    .trim()
    .replace(/[^a-z0-9-_]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return sanitized || 'document'
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
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
