import { Font } from '@react-pdf/renderer'
import carlito400 from '@rb/render/fonts/carlito/carlito-latin-400-normal.ttf?url'
import carlito400Italic from '@rb/render/fonts/carlito/carlito-latin-400-italic.ttf?url'
import carlito700 from '@rb/render/fonts/carlito/carlito-latin-700-normal.ttf?url'
import carlito700Italic from '@rb/render/fonts/carlito/carlito-latin-700-italic.ttf?url'
import sourceSerif400 from '@rb/render/fonts/source-serif/source-serif-latin-400-normal.ttf?url'
import sourceSerif400Italic from '@rb/render/fonts/source-serif/source-serif-latin-400-italic.ttf?url'
import sourceSerif700 from '@rb/render/fonts/source-serif/source-serif-latin-700-normal.ttf?url'
import sourceSerif700Italic from '@rb/render/fonts/source-serif/source-serif-latin-700-italic.ttf?url'

let registered = false

interface FontSources {
  regular: string
  bold: string
  italic: string
  boldItalic: string
}

/**
 * Under vitest the bundler URLs are not fetchable, so the files are read from
 * disk instead. That path only works in a node test environment — under jsdom
 * react-pdf resolves it through a browser code path that corrupts the font
 * bytes. See registerPdfFonts.test.ts.
 */
async function localSources(dirName: string, files: FontSources): Promise<FontSources> {
  const { dirname, join } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const dir = join(dirname(fileURLToPath(import.meta.url)), dirName)
  return {
    regular: join(dir, files.regular),
    bold: join(dir, files.bold),
    italic: join(dir, files.italic),
    boldItalic: join(dir, files.boldItalic),
  }
}

async function carlitoSources(): Promise<FontSources> {
  if (import.meta.env.MODE === 'test') {
    return localSources('carlito', {
      regular: 'carlito-latin-400-normal.ttf',
      bold: 'carlito-latin-700-normal.ttf',
      italic: 'carlito-latin-400-italic.ttf',
      boldItalic: 'carlito-latin-700-italic.ttf',
    })
  }
  return {
    regular: carlito400,
    bold: carlito700,
    italic: carlito400Italic,
    boldItalic: carlito700Italic,
  }
}

async function sourceSerifSources(): Promise<FontSources> {
  if (import.meta.env.MODE === 'test') {
    return localSources('source-serif', {
      regular: 'source-serif-latin-400-normal.ttf',
      bold: 'source-serif-latin-700-normal.ttf',
      italic: 'source-serif-latin-400-italic.ttf',
      boldItalic: 'source-serif-latin-700-italic.ttf',
    })
  }
  return {
    regular: sourceSerif400,
    bold: sourceSerif700,
    italic: sourceSerif400Italic,
    boldItalic: sourceSerif700Italic,
  }
}

/**
 * Carlito — metric-compatible Calibri substitute (OFL-1.1).
 * Source Serif 4 — Adobe text serif (OFL-1.1), used by the academic CV theme
 * in place of built-in Times-Roman.
 */
export async function ensurePdfFontsRegistered(): Promise<void> {
  if (registered) return

  // react-pdf hyphenates by default, which breaks words across lines in a
  // document where that is never wanted — headlines split mid-word and
  // verification URLs came out as "coursera.org/veri-/fy/KUV9ZOIPSDEV".
  // Returning the whole word disables it.
  Font.registerHyphenationCallback((word) => [word])

  const [carlito, sourceSerif] = await Promise.all([
    carlitoSources(),
    sourceSerifSources(),
  ])

  const families: Array<[string, FontSources]> = [
    ['Carlito', carlito],
    ['Source Serif 4', sourceSerif],
  ]

  for (const [family, src] of families) {
    Font.register({
      family,
      fonts: [
        { src: src.regular, fontWeight: 'normal' },
        { src: src.bold, fontWeight: 'bold' },
        { src: src.italic, fontWeight: 'normal', fontStyle: 'italic' },
        { src: src.boldItalic, fontWeight: 'bold', fontStyle: 'italic' },
      ],
    })
  }

  registered = true
}

/** Test helper — reset registration gate between test files. */
export function resetPdfFontRegistrationForTests(): void {
  registered = false
}
