import type { SectionId } from '@rb/core/types/document'

/** Dispatched before scrolling so the editor can open a collapsed section (and show the editor tab on a phone). */
export const FOCUS_SECTION_EVENT = 'rizzume:focus-section'

export interface FocusSectionDetail {
  sectionId: SectionId
}

const requestSection = (sectionId: SectionId) =>
  window.dispatchEvent(new CustomEvent<FocusSectionDetail>(FOCUS_SECTION_EVENT, { detail: { sectionId } }))

/** Smooth scrolling unless the user asked for reduced motion. */
const behavior = (): ScrollBehavior =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'

/**
 * Brings a form section into view and briefly rings it. The editor listens for FOCUS_SECTION_EVENT and
 * expands the section, so a jump lands on an open section even from the lint panel.
 */
export function scrollToFormSection(sectionId: SectionId) {
  requestSection(sectionId)
  // After React has flushed the expand that the event above triggers.
  window.setTimeout(() => {
    const el = window.document.getElementById(`form-section-${sectionId}`)
    if (!el) return
    el.scrollIntoView({ behavior: behavior(), block: 'start' })
    const ring = ['ring-2', 'ring-ring', 'ring-offset-2', 'ring-offset-background']
    el.classList.add(...ring)
    window.setTimeout(() => el.classList.remove(...ring), 1200)
  }, 0)
}

/** Opens the section a field lives in, scrolls the field into view and focuses it. */
export function scrollToField(fieldId: string, sectionId: SectionId = 'contact') {
  requestSection(sectionId)
  window.setTimeout(() => {
    const el = window.document.getElementById(fieldId)
    if (!el) return
    el.scrollIntoView({ behavior: behavior(), block: 'center' })
    el.focus({ preventScroll: true })
  }, 0)
}

const FIELD_IDS: Record<string, string> = {
  fullName: 'contact-full-name',
  email: 'contact-email',
  location: 'contact-location',
}

/** Where a lint issue lives: a contact field, or else its section. Used by the fix list and the ATS panel. */
export function jumpToIssue(issue: { field?: string; section?: SectionId }) {
  const fieldId = issue.field ? FIELD_IDS[issue.field] : undefined
  if (fieldId) {
    scrollToField(fieldId)
    return
  }
  if (issue.section) scrollToFormSection(issue.section)
}
