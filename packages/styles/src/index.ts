/**
 * Barrel for @rb/styles.
 *
 * The style resolver lives in one place: `shared/resolveDocumentStyles.ts`.
 * This file used to carry a second, near-identical copy of the whole resolver
 * (~280 lines) — the two drifted silently, because renderers imported the copy
 * here while `pageSpec` and the validators imported the one in `shared/`. A
 * change made to one was invisible to the other. Re-export instead of
 * redefining so there is a single source of truth for document geometry.
 */
export * from '@rb/styles/types'
export * from '@rb/styles/pageSpec'
export { resolveDocumentStyles, parityDeltaPt } from '@rb/styles/shared/resolveDocumentStyles'
