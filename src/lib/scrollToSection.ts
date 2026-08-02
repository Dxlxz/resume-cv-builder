import type { SectionId } from '@rb/core/types/document'

export function scrollToFormSection(sectionId: SectionId) {
  const el = window.document.getElementById(`form-section-${sectionId}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  el.classList.add('ring-2', 'ring-blue-300', 'ring-offset-2')
  window.setTimeout(() => {
    el.classList.remove('ring-2', 'ring-blue-300', 'ring-offset-2')
  }, 1200)
}
