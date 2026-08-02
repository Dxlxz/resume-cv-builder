import type { PDFDocumentProxy } from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'

let workerReady: Promise<void> | null = null

export async function ensurePdfJsWorker(): Promise<void> {
  if (!workerReady) {
    workerReady = (async () => {
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
      pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl
    })()
  }
  await workerReady
}

export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<PDFDocumentProxy> {
  await ensurePdfJsWorker()
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data)
  const task = pdfjs.getDocument({ data: bytes })
  return task.promise
}
