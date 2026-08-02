import type { ResumeDocument } from '@rb/core/types/document'
import {
  sampleCvDocument,
  sampleInternationalResumeDocument,
  sampleProfileDocument,
  sampleResumeDocument,
} from './sampleDocuments'

export {
  sampleCvDocument,
  sampleInternationalResumeDocument,
  sampleProfileDocument,
  sampleResumeDocument,
}

/**
 * Fictional product fixtures — see ./sampleDocuments.ts. The real personal
 * pack (Dale's profile) lives outside the product in `personal/` and must
 * never be imported here.
 */
export const sampleMalaysiaResume: ResumeDocument = sampleResumeDocument
export const sampleResume: ResumeDocument = sampleInternationalResumeDocument
export const sampleCv: ResumeDocument = sampleCvDocument
