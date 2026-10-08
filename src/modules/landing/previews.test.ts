/**
 * @vitest-environment node
 *
 * F-008: every template on the landing page has a pre-rendered preview. A template added without running
 * `pnpm run landing:previews` fails here instead of showing a broken image.
 */
import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { TEMPLATE_IDS } from '@rb/core/types/document'

const dir = join(process.cwd(), 'public/landing')

describe('landing previews', () => {
  it.each(TEMPLATE_IDS)('has a preview image for %s', (id) => {
    expect(existsSync(join(dir, `template-${id}.webp`))).toBe(true)
  })

  it('has the hero image', () => {
    expect(existsSync(join(dir, 'hero.webp'))).toBe(true)
  })
})
