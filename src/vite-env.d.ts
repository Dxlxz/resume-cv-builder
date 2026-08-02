/// <reference types="vite/client" />

/**
 * True when a private personal pack exists at `personal/personal-profile.ts`
 * (set by vite.config.ts). Product builds ship with this false — profile
 * features disable themselves and no personal data is bundled.
 */
declare const __HAS_PERSONAL__: boolean

/**
 * Ambient declaration for the private personal pack (`personal/`, gitignored).
 * Resolved at dev/test time by a vite alias when the folder exists; left as an
 * external dynamic import in product builds. This declaration keeps `tsc`
 * green in clean checkouts that have no personal pack.
 */
declare module '@personal/profile' {
  import type { DocumentType, ResumeDocument } from '@rb/core/types/document'
  export function personalDocumentFor(type: DocumentType): ResumeDocument
  export const personalProfileDocument: ResumeDocument
  export const personalResumeDocument: ResumeDocument
  export const personalCvDocument: ResumeDocument
}
