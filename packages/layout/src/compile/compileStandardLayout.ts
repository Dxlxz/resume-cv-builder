import type { ResumeDocument, SectionId } from '@rb/core/types/document'
import { getVisibleSections } from '@rb/core/selectors/getVisibleSections'
import { getSectionLabel } from '@rb/core/selectors/getSectionLabel'
import { getPageSpec } from '@rb/styles'
import { resolveDocumentStyles } from '@rb/styles'
import { formatDateRange } from '@rb/core/utils'
import type { LayoutBlock, LayoutDocument } from '@rb/layout/types'
import type { LayoutProfile, TypographyScale } from '@rb/themes/types'
import { shouldKeepItemTogether } from '@rb/templates/shared/spacingHelpers'
import { chunkSkillItems } from '@rb/layout/compile/skillLines'

function titleBlock(
  id: string,
  text: string,
  isFirst: boolean,
  spacingBeforePt: number,
): LayoutBlock {
  return {
    id,
    type: 'sectionTitle',
    breakPolicy: 'keepWithNext',
    spacingBeforePt,
    spacingAfterPt: 0,
    content: { kind: 'sectionTitle', text, isFirst },
  }
}

interface CompileContext {
  document: ResumeDocument
  blocks: LayoutBlock[]
  layout: LayoutProfile
  typography: TypographyScale
  contentHeightPt: number
  isFirstSection: boolean
  sectionTopGap: (first: boolean) => number
  presetLabels: Partial<Record<SectionId, string>>
}

function pushTitle(ctx: CompileContext, id: string, section: SectionId) {
  const { blocks } = ctx
  const first = ctx.isFirstSection
  blocks.push(
    titleBlock(
      id,
      getSectionLabel(section, ctx.presetLabels),
      first,
      ctx.sectionTopGap(first),
    ),
  )
  ctx.isFirstSection = false
}

function emitSummary(ctx: CompileContext) {
  const { document, blocks, layout } = ctx
  if (!document.summary.trim()) return
  pushTitle(ctx, 'summary-title', 'summary')
  blocks.push({
    id: 'summary-body',
    type: 'paragraph',
    breakPolicy: 'auto',
    spacingBeforePt: 0,
    spacingAfterPt: layout.paragraphGapPt,
    content: { kind: 'paragraph', text: document.summary.trim() },
  })
}

/**
 * Apply the preset's bullet cap. spacing-lint warns when bullets are hidden,
 * so the cap is visible guidance rather than silent loss.
 */
function capBullets(bullets: string[], layout: LayoutProfile): string[] {
  const cap = layout.maxBulletsPerItem
  return cap && bullets.length > cap ? bullets.slice(0, cap) : bullets
}

/**
 * Emit bullet blocks of a fragmented item. The planner breaks between bullets;
 * the penultimate bullet keeps with the last one so no bullet is ever widowed
 * alone at the top of a page.
 */
function pushItemBullets(
  ctx: CompileContext,
  itemBlockId: string,
  bullets: string[],
) {
  const { blocks, layout } = ctx
  bullets.forEach((text, index) => {
    const last = index === bullets.length - 1
    const widowGuard = !last && index === bullets.length - 2
    blocks.push({
      id: `${itemBlockId}-b${index}`,
      type: 'bullet',
      breakPolicy: widowGuard ? 'keepWithNext' : 'auto',
      spacingBeforePt: 0,
      spacingAfterPt: last ? layout.itemGapPt : layout.bulletGapPt,
      content: { kind: 'bullet', text },
    })
  })
}

function emitExperienceLike(
  ctx: CompileContext,
  idPrefix: 'experience' | 'volunteer',
  items: ResumeDocument['experience'],
) {
  const { blocks, layout, typography, contentHeightPt } = ctx
  for (const item of items) {
    const bullets = capBullets(item.bullets.filter(Boolean), layout)
    const dates = formatDateRange(item.startDate, item.endDate, item.present)
    const blockId = `${idPrefix}-${item.id}`
    if (shouldKeepItemTogether(bullets.length, typography, layout, contentHeightPt)) {
      blocks.push({
        id: blockId,
        type: 'experienceItem',
        breakPolicy: 'keep',
        spacingBeforePt: 0,
        spacingAfterPt: layout.itemGapPt,
        content: {
          kind: 'experienceItem',
          title: item.title,
          company: item.company,
          location: item.location ?? '',
          dates,
          bullets,
        },
      })
      continue
    }
    blocks.push({
      id: blockId,
      type: 'itemHeader',
      breakPolicy: 'keepWithNext',
      spacingBeforePt: 0,
      spacingAfterPt: bullets.length > 0 ? layout.bulletGapPt : layout.itemGapPt,
      content: {
        kind: 'itemHeader',
        title: item.title,
        subtitle:
          [item.company, item.location].filter(Boolean).join(', ') || undefined,
        dates,
      },
    })
    pushItemBullets(ctx, blockId, bullets)
  }
}

function emitExperience(ctx: CompileContext) {
  if (ctx.document.experience.length === 0) return
  pushTitle(ctx, 'experience-title', 'experience')
  emitExperienceLike(ctx, 'experience', ctx.document.experience)
}

function emitVolunteer(ctx: CompileContext) {
  if (ctx.document.volunteer.length === 0) return
  pushTitle(ctx, 'volunteer-title', 'volunteer')
  emitExperienceLike(ctx, 'volunteer', ctx.document.volunteer)
}

function emitEducation(ctx: CompileContext) {
  const { document, blocks, layout } = ctx
  if (document.education.length === 0) return
  pushTitle(ctx, 'education-title', 'education')
  for (const item of document.education) {
    const degreeLine =
      item.field?.trim() && !item.degree.includes(item.field.trim())
        ? `${item.degree}, ${item.field.trim()}`
        : item.degree
    blocks.push({
      id: `education-${item.id}`,
      type: 'educationItem',
      breakPolicy: 'keep',
      spacingBeforePt: 0,
      spacingAfterPt: layout.itemGapPt,
      content: {
        kind: 'educationItem',
        institution: item.institution,
        degree: degreeLine,
        dates: formatDateRange(item.startDate, item.endDate),
        honors: item.honors?.trim() || undefined,
      },
    })
  }
}

function emitSkills(ctx: CompileContext) {
  const { document, blocks, layout } = ctx
  if (document.skills.length === 0) return
  pushTitle(ctx, 'skills-title', 'skills')
  for (const group of document.skills) {
    blocks.push({
      id: `skill-${group.id}`,
      type: 'skillGroup',
      breakPolicy: 'auto',
      spacingBeforePt: 0,
      spacingAfterPt: layout.skillGroupGapPt,
      content: {
        kind: 'skillGroup',
        name: group.name ?? '',
        itemLines: chunkSkillItems(group.items, layout.skillLineMaxChars),
      },
    })
  }
}

function formatCertificationLine(item: ResumeDocument['certifications'][0]): string {
  const parts = [item.name, item.issuer].filter(Boolean)
  let line = parts.join(', ')
  if (item.completed?.trim()) line += ` (${item.completed.trim()})`
  if (item.verifyUrl?.trim()) {
    const verify = item.verifyUrl.trim().replace(/^https?:\/\//, '')
    line += `. Verify: ${verify}`
  }
  return line
}

function emitCertifications(ctx: CompileContext) {
  const { document, blocks, layout } = ctx
  if (document.certifications.length === 0) return
  pushTitle(ctx, 'certifications-title', 'certifications')
  for (const item of document.certifications) {
    const text = formatCertificationLine(item)
    if (!text.trim()) continue
    blocks.push({
      id: `certification-${item.id}`,
      type: 'bullet',
      breakPolicy: 'auto',
      spacingBeforePt: 0,
      spacingAfterPt: layout.bulletGapPt,
      content: { kind: 'bullet', text },
    })
  }
}

function emitReferences(ctx: CompileContext) {
  const { document, blocks, layout } = ctx
  if (document.references.length === 0) return
  pushTitle(ctx, 'references-title', 'references')
  for (const item of document.references) {
    const contactLine = [item.phone, item.email].filter(Boolean).join(' · ')
    blocks.push({
      id: `reference-${item.id}`,
      type: 'referenceItem',
      breakPolicy: 'keep',
      spacingBeforePt: 0,
      spacingAfterPt: layout.itemGapPt,
      content: {
        kind: 'referenceItem',
        name: item.name,
        title: item.title,
        company: item.company,
        contactLine,
      },
    })
  }
}

function emitProjects(ctx: CompileContext) {
  const { document, blocks, layout, typography, contentHeightPt } = ctx
  if (document.projects.length === 0) return
  pushTitle(ctx, 'projects-title', 'projects')
  for (const item of document.projects) {
    const bullets = capBullets(item.bullets.filter(Boolean), layout)
    const blockId = `project-${item.id}`
    if (shouldKeepItemTogether(bullets.length, typography, layout, contentHeightPt)) {
      blocks.push({
        id: blockId,
        type: 'projectItem',
        breakPolicy: 'keep',
        spacingBeforePt: 0,
        spacingAfterPt: layout.itemGapPt,
        content: {
          kind: 'projectItem',
          name: item.name,
          description: item.description ?? '',
          url: item.url?.trim() || undefined,
          bullets,
        },
      })
      continue
    }
    blocks.push({
      id: blockId,
      type: 'itemHeader',
      breakPolicy: 'keepWithNext',
      spacingBeforePt: 0,
      spacingAfterPt: bullets.length > 0 ? layout.bulletGapPt : layout.itemGapPt,
      content: {
        kind: 'itemHeader',
        title: item.name,
        subtitle: item.description?.trim() || undefined,
        meta: item.url?.trim().replace(/^https?:\/\//, '') || undefined,
      },
    })
    pushItemBullets(ctx, blockId, bullets)
  }
}

const SECTION_EMITTERS: Record<Exclude<SectionId, 'contact'>, (ctx: CompileContext) => void> = {
  summary: emitSummary,
  experience: emitExperience,
  education: emitEducation,
  certifications: emitCertifications,
  skills: emitSkills,
  projects: emitProjects,
  volunteer: emitVolunteer,
  references: emitReferences,
}

export function compileStandardLayout(
  document: ResumeDocument,
  presetLabels: Partial<Record<SectionId, string>> = {},
): LayoutDocument {
  const sections = getVisibleSections(document)
  const resolved = resolveDocumentStyles(document)
  const pageSpec = getPageSpec(document)
  const { layout, typography } = resolved
  const { contact } = document
  const blocks: LayoutBlock[] = []

  // Links display without protocol/www — shorter header lines, no wrapping.
  const displayUrl = (url?: string) =>
    url?.trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') ?? ''

  const metaLines = [
    [contact.email, contact.phone, contact.location].filter(Boolean).join(' · '),
    [displayUrl(contact.linkedIn), displayUrl(contact.website)]
      .filter(Boolean)
      .join(' · '),
  ].filter(Boolean)

  blocks.push({
    id: 'header',
    type: 'header',
    breakPolicy: 'keep',
    spacingBeforePt: 0,
    spacingAfterPt: 0,
    content: {
      kind: 'header',
      name: contact.fullName || 'Your Name',
      headline: contact.headline?.trim() || undefined,
      metaLines,
    },
  })

  const ctx: CompileContext = {
    document,
    blocks,
    layout,
    typography,
    contentHeightPt: pageSpec.contentHeightPt,
    isFirstSection: true,
    sectionTopGap: (first) => (first ? layout.ruleToFirstSectionPt : layout.sectionGapPt),
    presetLabels,
  }

  for (const sectionId of sections) {
    if (sectionId === 'contact') continue
    SECTION_EMITTERS[sectionId]?.(ctx)
  }

  return {
    templateId: document.meta.templateId,
    blocks,
    contentWidthPt: pageSpec.widthMm * (72 / 25.4) - layout.pageMarginPt * 2,
    contentHeightPt: pageSpec.contentHeightPt,
  }
}
