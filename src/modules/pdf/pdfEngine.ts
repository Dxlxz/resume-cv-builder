/** Which PDF engine renders. Typst is the default (F-006); react-pdf stays as the fallback until it is retired. */
export type PdfEngine = 'react-pdf' | 'typst'

const STORAGE_KEY = 'rizzume.pdfEngine'

/**
 * `?engine=react-pdf` switches this browser to the old engine and `?engine=typst` back; the choice is remembered in
 * localStorage. Anything unreadable (no window, blocked storage) means the default, Typst.
 */
export function pdfEngine(): PdfEngine {
  try {
    const param = new URLSearchParams(window.location.search).get('engine')
    if (param === 'typst' || param === 'react-pdf') {
      localStorage.setItem(STORAGE_KEY, param)
      return param
    }
    return localStorage.getItem(STORAGE_KEY) === 'react-pdf' ? 'react-pdf' : 'typst'
  } catch {
    return 'typst'
  }
}
