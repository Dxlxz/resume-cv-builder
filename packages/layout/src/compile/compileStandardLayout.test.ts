import { describe, expect, it } from 'vitest'
import type { SectionId } from '@rb/core/types/document'
import {sampleCvDocument, sampleProfileDocument} from '@rb/fixtures'
import { compileStandardLayout } from '@rb/layout/compile/compileStandardLayout'

describe('compileStandardLayout', () => {
  it('produces stable block ids for personal profile', () => {
    const layout = compileStandardLayout(sampleProfileDocument)
    const ids = layout.blocks.map((b) => b.id)

    expect(ids[0]).toBe('header')
    expect(ids).toContain('summary-title')
    expect(ids).toContain('summary-body')
    expect(ids).toContain('experience-title')
    expect(ids.some((id) => id.startsWith('experience-') && id !== 'experience-title')).toBe(true)
    expect(ids).toContain('skills-title')
    expect(layout.contentWidthPt).toBeGreaterThan(400)
    expect(layout.contentHeightPt).toBeGreaterThan(600)
  })

  it('uses ruleToFirstSectionPt before first section title', () => {
    const layout = compileStandardLayout(sampleProfileDocument)
    const firstTitle = layout.blocks.find((b) => b.type === 'sectionTitle')
    expect(firstTitle?.spacingBeforePt).toBeGreaterThanOrEqual(10)
  })

  it('marks section titles with keepWithNext policy', () => {
    const layout = compileStandardLayout(sampleProfileDocument)
    for (const block of layout.blocks.filter((b) => b.type === 'sectionTitle')) {
      expect(block.breakPolicy).toBe('keepWithNext')
    }
  })

  it('fragments long CV items into header + bullet blocks', () => {
    // The CV has no bullet cap — its 11- and 8-bullet roles must fragment.
    const layout = compileStandardLayout(sampleCvDocument)
    const headers = layout.blocks.filter((b) => b.type === 'itemHeader')

    expect(headers.length).toBeGreaterThanOrEqual(2)
    for (const header of headers) {
      expect(header.breakPolicy).toBe('keepWithNext')
      const bullets = layout.blocks.filter((b) => b.id.startsWith(`${header.id}-b`))
      expect(bullets.length).toBeGreaterThan(3)
      // Penultimate bullet guards against a widowed last bullet.
      expect(bullets[bullets.length - 2].breakPolicy).toBe('keepWithNext')
      expect(bullets[bullets.length - 1].breakPolicy).toBe('auto')
    }
  })

  it('keeps all curated resume items whole (max 3 bullets, capped by preset)', () => {
    const layout = compileStandardLayout(sampleProfileDocument)
    expect(layout.blocks.filter((b) => b.type === 'itemHeader')).toHaveLength(0)
    const whole = layout.blocks.filter((b) => b.type === 'experienceItem')
    expect(whole.length).toBeGreaterThanOrEqual(3)
    for (const block of whole) {
      expect(block.breakPolicy).toBe('keep')
      if (block.content.kind === 'experienceItem') {
        expect(block.content.bullets.length).toBeLessThanOrEqual(3)
      }
    }
  })

  it('orders sections by document.meta.sectionOrder', () => {
    const doc = {
      ...sampleProfileDocument,
      meta: {
        ...sampleProfileDocument.meta,
        sectionOrder: [
          'contact',
          'summary',
          'education',
          'experience',
          'skills',
          'projects',
        ] as SectionId[],
      },
    }
    const layout = compileStandardLayout(doc)
    const titleIds = layout.blocks
      .filter((b) => b.type === 'sectionTitle')
      .map((b) => b.id)

    const eduIdx = titleIds.indexOf('education-title')
    const expIdx = titleIds.indexOf('experience-title')
    expect(eduIdx).toBeGreaterThanOrEqual(0)
    expect(expIdx).toBeGreaterThan(eduIdx)
  })
})
