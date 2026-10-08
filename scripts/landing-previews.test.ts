/**
 * @vitest-environment node
 *
 * Renders the landing page's preview PDFs with the product's own engine (Typst), from fictional sample data. Skipped
 * in normal test runs; `pnpm run landing:previews` sets RENDER_LANDING and then rasterises the PDFs to WebP
 * (scripts/landing-previews.py). The landing page shows images, not live renders, so a first visit never downloads
 * the Typst compiler.
 */
import { describe, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TEMPLATE_IDS, type ResumeDocument } from '@rb/core/types/document'
import { sampleResumeDocument } from '@rb/fixtures'
import { themeForDocument } from '@rb/themes/registry'
import { getPreset } from '@rb/presets/registry'
import { renderDocumentWithTypst } from '@rb/typst/renderWithTypst'

const OUT = process.env.RENDER_LANDING ?? ''

async function write(doc: ResumeDocument, name: string) {
  const blob = await renderDocumentWithTypst(doc, getPreset(doc.meta.presetId).labels)
  writeFileSync(join(OUT, `${name}.pdf`), new Uint8Array(await blob.arrayBuffer()))
}

describe.skipIf(!OUT)('landing previews', () => {
  it('renders the hero and one page per template', async () => {
    mkdirSync(OUT, { recursive: true })
    await write(sampleResumeDocument, 'hero')
    for (const templateId of TEMPLATE_IDS) {
      const { meta } = sampleResumeDocument
      const themeId = themeForDocument(templateId, meta.documentType, meta.themeId)
      await write({ ...sampleResumeDocument, meta: { ...meta, templateId, themeId } }, `template-${templateId}`)
    }
  }, 120000)
})
