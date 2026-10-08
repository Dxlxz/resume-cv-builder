/**
 * True when the PDF should be drawn with pdf.js on canvases, which is the default: the preview then looks the same in
 * every browser, carries our own controls, and is the exact exported file. `?pdf=native` switches back to the
 * browser's built-in viewer, where one exists (phones show an iframe PDF as one static page or a download link).
 */
export function preferCanvasPdf(): boolean {
  const native = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pdf') === 'native'
  if (!native) return true
  return typeof navigator !== 'undefined' && navigator.pdfViewerEnabled === false
}
