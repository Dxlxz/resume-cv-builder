/**
 * Test-only stub for the private personal pack. The vite config aliases
 * `@personal/profile` here when the real pack is absent (CI, clean
 * checkouts) so the app's dynamic import resolves. The feature is gated
 * by `__HAS_PERSONAL__` being false in those environments, so nothing
 * calls through to these.
 */
export const personalProfileDocument = null
export const personalResumeDocument = null
export const personalCvDocument = null

export function personalDocumentFor(): never {
  throw new Error('No personal pack available in this environment.')
}
