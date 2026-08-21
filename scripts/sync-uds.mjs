#!/usr/bin/env node
/**
 * sync-uds.mjs — keep vendored UDS CSS in sync with the source monorepo.
 *
 * Usage:
 *   node scripts/sync-uds.mjs            # sync (copy source → vendored)
 *   node scripts/sync-uds.mjs --check    # drift check only (exit 1 when behind)
 *
 * Vendored files (see packages/styles/src/uds/README.md):
 *   tokens.css       ← <UDS>/packages/tokens/src/tokens.css
 *   theme-inline.css ← <UDS>/packages/tailwind/src/theme-inline.css
 *
 * The UDS monorepo path is resolved via the UDS_ROOT env var, falling back to
 * the well-known default C:\Users\Dale\Desktop\Universal Design System.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const UDS_ROOT = process.env.UDS_ROOT ?? 'C:/Users/Dale/Desktop/Universal Design System'

const PAIRS = [
  ['packages/tokens/src/tokens.css', 'packages/styles/src/uds/tokens.css'],
  ['packages/tailwind/src/theme-inline.css', 'packages/styles/src/uds/theme-inline.css'],
]

const check = process.argv.includes('--check')
let changed = false

/**
 * Strip the leading doc block on either side (the app's VENDORED banner is
 * spliced INTO the original UDS comment, so comparing whole comment blocks is
 * the only robust equivalent). Returns a Buffer (byte-accurate).
 */
function stripDocBlock(buf) {
  let text = buf.toString('utf8')
  if (text.startsWith('/**')) {
    const end = text.indexOf('*/')
    if (end !== -1) text = text.slice(end + 2)
  }
  return Buffer.from(text)
}

/** Re-apply the existing app banner (or a default one) onto synced content. */
function withBanner(dstBuf, srcBuf) {
  const existing = dstBuf?.toString('utf8') ?? ''
  const banner = existing.startsWith('/**') ? existing.slice(0, existing.indexOf('*/') + 2) :
    `/**\n * VENDORED from the Universal Design System monorepo — auto-synced by scripts/sync-uds.mjs.\n * Do not hand-edit unless intentionally app-local (see packages/styles/src/uds/README.md).\n */\n`
  return Buffer.from(banner + srcBuf.toString('utf8'))
}

for (const [srcRel, dstRel] of PAIRS) {
  const src = resolve(UDS_ROOT, srcRel)
  const dst = resolve(ROOT, dstRel)
  console.log(`\n${srcRel}\n  → ${dstRel}`)

  if (!existsSync(src)) {
    console.error(`  ✗ source missing: ${src}`)
    process.exitCode = 1
    continue
  }
  const srcBuf = readFileSync(src)
  const dstBuf = existsSync(dst) ? readFileSync(dst) : Buffer.alloc(0)
  const srcContent = stripDocBlock(srcBuf)
  const dstContent = stripDocBlock(dstBuf)
  if (srcContent.equals(dstContent)) {
    console.log('  ✓ in sync')
    continue
  }

  const srcTime = statSync(src).mtime.toISOString().slice(0, 10)
  console.log(`  Δ differs — source mtime ${srcTime} (${srcContent.length - dstContent.length > 0 ? '+' : ''}${srcContent.length - dstContent.length} bytes of content against vendored)`)
  changed = true
  if (!check) {
    writeFileSync(dst, withBanner(dstBuf, srcContent))
    console.log('  ✓ copied (header preserved; re-verify with the app test suite)')
  }
}

if (changed) {
  if (check) {
    console.error('\nDRIFT DETECTED — vendored UDS is behind source. Run `node scripts/sync-uds.mjs`, re-verify, commit.')
    process.exit(1)
  }
  console.log('\nSynced. Re-copy the README sync instructions into packages/styles/src/uds/README.md if they changed.')
} else {
  console.log('\nAll vendored UDS files in sync.')
}