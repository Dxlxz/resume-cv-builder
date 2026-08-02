import { Font } from '@react-pdf/renderer'
import carlito400 from '@rb/render/fonts/carlito/carlito-latin-400-normal.ttf?url'
import carlito400Italic from '@rb/render/fonts/carlito/carlito-latin-400-italic.ttf?url'
import carlito700 from '@rb/render/fonts/carlito/carlito-latin-700-normal.ttf?url'
import carlito700Italic from '@rb/render/fonts/carlito/carlito-latin-700-italic.ttf?url'

let registered = false

async function carlitoSources(): Promise<{
  regular: string
  bold: string
  italic: string
  boldItalic: string
}> {
  if (import.meta.env.MODE === 'test') {
    const { dirname, join } = await import('node:path')
    const { fileURLToPath } = await import('node:url')
    const dir = join(dirname(fileURLToPath(import.meta.url)), 'carlito')
    return {
      regular: join(dir, 'carlito-latin-400-normal.ttf'),
      bold: join(dir, 'carlito-latin-700-normal.ttf'),
      italic: join(dir, 'carlito-latin-400-italic.ttf'),
      boldItalic: join(dir, 'carlito-latin-700-italic.ttf'),
    }
  }
  return {
    regular: carlito400,
    bold: carlito700,
    italic: carlito400Italic,
    boldItalic: carlito700Italic,
  }
}

/** Carlito — metric-compatible Calibri substitute (OFL-1.1). */
export async function ensurePdfFontsRegistered(): Promise<void> {
  if (registered) return

  const src = await carlitoSources()

  Font.register({
    family: 'Carlito',
    fonts: [
      { src: src.regular, fontWeight: 'normal' },
      { src: src.bold, fontWeight: 'bold' },
      { src: src.italic, fontWeight: 'normal', fontStyle: 'italic' },
      { src: src.boldItalic, fontWeight: 'bold', fontStyle: 'italic' },
    ],
  })

  registered = true
}

/** Test helper — reset registration gate between test files. */
export function resetPdfFontRegistrationForTests(): void {
  registered = false
}
