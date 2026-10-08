import { createTypstCompiler, initOptions, loadFonts, type TypstCompiler } from '@myriaddreamin/typst.ts'
import wasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url'
import carlito400 from '@rb/render/fonts/carlito/carlito-latin-400-normal.ttf?url'
import carlito400Italic from '@rb/render/fonts/carlito/carlito-latin-400-italic.ttf?url'
import carlito700 from '@rb/render/fonts/carlito/carlito-latin-700-normal.ttf?url'
import carlito700Italic from '@rb/render/fonts/carlito/carlito-latin-700-italic.ttf?url'
import serif400 from '@rb/render/fonts/source-serif/source-serif-latin-400-normal.ttf?url'
import serif400Italic from '@rb/render/fonts/source-serif/source-serif-latin-400-italic.ttf?url'
import serif700 from '@rb/render/fonts/source-serif/source-serif-latin-700-normal.ttf?url'
import serif700Italic from '@rb/render/fonts/source-serif/source-serif-latin-700-italic.ttf?url'

/**
 * The Typst WASM compiler (~28 MB, ~7 MB brotli). This module is only reached through a dynamic import when a PDF is
 * first rendered, so neither it nor the WASM is part of the startup bundle.
 */

const FONT_FILES = {
  carlito: ['carlito-latin-400-normal.ttf', 'carlito-latin-400-italic.ttf', 'carlito-latin-700-normal.ttf', 'carlito-latin-700-italic.ttf'],
  'source-serif': ['source-serif-latin-400-normal.ttf', 'source-serif-latin-400-italic.ttf', 'source-serif-latin-700-normal.ttf', 'source-serif-latin-700-italic.ttf'],
} as const

const FONT_URLS = [carlito400, carlito400Italic, carlito700, carlito700Italic, serif400, serif400Italic, serif700, serif700Italic]

/** Bundler URLs are not fetchable under vitest, so tests read the same files from disk (as registerPdfFonts does). */
async function nodeAssets(): Promise<{ wasm: Uint8Array; fonts: Uint8Array[] }> {
  const { readFile } = await import('node:fs/promises')
  const { createRequire } = await import('node:module')
  const { dirname, join } = await import('node:path')
  const { fileURLToPath } = await import('node:url')
  const require = createRequire(import.meta.url)
  const wasm = await readFile(require.resolve('@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm'))
  const fontsDir = join(dirname(fileURLToPath(import.meta.url)), '../../render/src/fonts')
  const fonts = await Promise.all(
    Object.entries(FONT_FILES).flatMap(([dir, files]) => files.map((f) => readFile(join(fontsDir, dir, f)))),
  )
  return { wasm: new Uint8Array(wasm), fonts: fonts.map((b) => new Uint8Array(b)) }
}

async function browserFonts(): Promise<Uint8Array[]> {
  return Promise.all(
    FONT_URLS.map(async (url) => {
      const res = await fetch(url)
      // Default fonts are disabled, so a missing font would silently drop text: fail, and let react-pdf render.
      if (!res.ok) throw new Error(`Font fetch failed (${res.status}): ${url}`)
      return new Uint8Array(await res.arrayBuffer())
    }),
  )
}

let compilerReady: Promise<TypstCompiler> | null = null
/** Compiles are serialised: the compiler holds one shadow file system, so two at once would share /main.typ. */
let queue: Promise<unknown> = Promise.resolve()

function compiler(): Promise<TypstCompiler> {
  if (!compilerReady) {
    compilerReady = (async () => {
      const isTest = import.meta.env.MODE === 'test'
      const assets = isTest ? await nodeAssets() : { wasm: null, fonts: await browserFonts() }
      const c = createTypstCompiler()
      await c.init({
        getModule: () => (assets.wasm ?? fetch(wasmUrl)),
        // Only our two embedded families: no default font download, so the output never depends on a CDN.
        beforeBuild: [initOptions.disableDefaultFontAssets(), loadFonts(assets.fonts)],
      })
      return c
    })()
    compilerReady.catch(() => {
      compilerReady = null
    })
  }
  return compilerReady
}

export class TypstCompileError extends Error {}

/** A compile that has not finished by then is treated as hung. Compiler start-up (the WASM download) is not timed. */
const COMPILE_TIMEOUT_MS = 15_000

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Typst compile timed out after ${ms} ms`)), ms)
  })
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer))
}

/** Compiles Typst source to PDF bytes. */
export function compileTypstToPdf(source: string): Promise<Uint8Array> {
  const run = queue.then(async () => {
    const c = await compiler()
    let result
    try {
      c.addSource('/main.typ', source)
      result = await withTimeout(c.compile({ mainFilePath: '/main.typ', format: 1, diagnostics: 'unix' }), COMPILE_TIMEOUT_MS)
    } catch (err) {
      // A panic or a hang may leave the instance unusable: drop it, so the next render starts a fresh compiler.
      compilerReady = null
      throw err
    }
    if (!result.result) {
      // Diagnostics mean the source was rejected; the compiler itself is fine and is kept.
      throw new TypstCompileError(`Typst compile failed: ${(result.diagnostics ?? []).join('; ')}`)
    }
    return result.result
  })
  queue = run.catch(() => undefined)
  return run
}
