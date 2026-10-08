// Regenerates public/landing/*.webp: renders sample PDFs with Typst (vitest, gated), then rasterises them (Python).
// Usage: pnpm run landing:previews
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const pdfDir = mkdtempSync(join(tmpdir(), 'rizzume-landing-'))
try {
  // Run vitest's own entry with this Node: no shell and no .cmd shim, on every platform.
  execFileSync(process.execPath, [join('node_modules', 'vitest', 'vitest.mjs'), 'run', 'scripts/landing-previews.test.ts'], {
    stdio: 'inherit',
    env: { ...process.env, RENDER_LANDING: pdfDir },
  })
  const python = process.env.PYTHON ?? (process.platform === 'win32' ? 'py' : 'python3')
  execFileSync(python, ['scripts/landing-previews.py', pdfDir, 'public/landing'], { stdio: 'inherit' })
} finally {
  rmSync(pdfDir, { recursive: true, force: true })
}
