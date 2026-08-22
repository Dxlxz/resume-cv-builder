import { Text, View } from '@react-pdf/renderer'
import type { LayoutBlock } from '@rb/layout/types'
import type { PdfStyle, ResolvedStyles } from '@rb/styles/shared/types'
import { blockWrapperStylePt } from '@rb/render/blocks/blockSpacing'
import type { PdfBlockStyles } from '@rb/render/blocks/pdfBlockStyles'
import { HeaderMetaLinesPdf } from '@rb/templates/shared/headerMetaLines'
import {
  pdfBreakHint,
  pdfMinPresenceHint,
  pdfWrapHint,
} from '@rb/templates/shared/blockHints'
import {
  accentBarHeightPt,
  bulletIndentPt,
  skillColumnWidth,
  skillGridGutterPt,
  skillGridRowGapPt,
  usesAccentBar,
  usesInlineRule,
  usesRail,
  usesSkillGrid,
} from '@rb/render/blocks/blockVariants'

interface LayoutBlockPdfProps {
  block: LayoutBlock
  sheet: PdfBlockStyles
  resolved: ResolvedStyles
  minPresence: number
}

/** Hanging bullet: glyph column + text column (parity with LayoutBlockHtml). */
function BulletRowPdf({
  text,
  sheet,
  last,
}: {
  text: string
  sheet: PdfBlockStyles
  last?: boolean
}) {
  return (
    <View style={last ? sheet.bulletRowLast : sheet.bulletRow}>
      <Text style={sheet.bulletGlyph}>•</Text>
      <Text style={sheet.bulletText}>{text}</Text>
    </View>
  )
}

/**
 * Rail entry: dates in a fixed left gutter, content in the remaining column.
 * Mirrors RailRowHtml, so the measured height matches what react-pdf lays out.
 */
function RailRowPdf({
  dates,
  sheet,
  resolved,
  children,
}: {
  dates?: string
  sheet: PdfBlockStyles
  resolved: ResolvedStyles
  children: React.ReactNode
}) {
  const { layout } = resolved
  return (
    <View style={{ flexDirection: 'row' }}>
      <View
        style={{
          width: layout.railWidthPt,
          paddingRight: layout.railGutterPt,
        }}
      >
        {dates ? <Text style={sheet.railDate}>{dates}</Text> : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  )
}

/** Section title with an accent bar or a trailing hairline. */
function SectionTitlePdf({
  text,
  style,
  sheet,
  resolved,
}: {
  text: string
  style: PdfStyle
  sheet: PdfBlockStyles
  resolved: ResolvedStyles
}) {
  const { layout, typography, theme } = resolved
  if (usesAccentBar(layout)) {
    return (
      <View style={{ ...style, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: layout.accentBarWidthPt,
            height: accentBarHeightPt(layout, typography.sectionSize),
            backgroundColor: theme.colors.accent,
            marginRight: layout.accentBarGapPt,
          }}
        />
        <Text style={sheet.sectionTitleText}>{text}</Text>
      </View>
    )
  }
  if (usesInlineRule(layout)) {
    return (
      <View style={{ ...style, flexDirection: 'row', alignItems: 'center' }}>
        <Text style={sheet.sectionTitleText}>{text}</Text>
        <View
          style={{
            flex: 1,
            height: layout.headerBorderWidthPt,
            backgroundColor: theme.colors.border,
            marginLeft: layout.inlineRuleGapPt,
          }}
        />
      </View>
    )
  }
  return <Text style={style}>{text}</Text>
}

export function LayoutBlockPdf({
  block,
  sheet,
  resolved,
  minPresence,
}: LayoutBlockPdfProps) {
  const { content } = block
  const wrapHint = pdfWrapHint(block.id)
  const breakHint = pdfBreakHint(block.id)
  // Plan collapses spacingBefore at the top of a page; mirror it here so a
  // forced page break does not leave a section-gap band under the top margin.
  const base = blockWrapperStylePt(block)
  const wrapper: PdfStyle = breakHint ? { ...base, marginTop: 0 } : { ...base }

  switch (content.kind) {
    case 'header':
      return (
        <View style={wrapper} wrap={false} break={breakHint}>
          <View style={sheet.header}>
            <Text style={sheet.name}>{content.name}</Text>
            {content.headline ? (
              <Text style={sheet.headline}>{content.headline}</Text>
            ) : null}
            <HeaderMetaLinesPdf
              lines={content.metaLines}
              metaStyle={sheet.meta}
              layout={resolved.layout}
            />
          </View>
        </View>
      )
    case 'sectionTitle': {
      const titleStyle: PdfStyle = {
        ...(content.isFirst ? sheet.sectionTitleFirst : sheet.sectionTitle),
        ...wrapper,
      }
      if (usesAccentBar(resolved.layout) || usesInlineRule(resolved.layout)) {
        return (
          <View
            minPresenceAhead={pdfMinPresenceHint(block.id, minPresence)}
            break={breakHint}
            wrap={false}
          >
            <SectionTitlePdf
              text={content.text}
              style={titleStyle}
              sheet={sheet}
              resolved={resolved}
            />
          </View>
        )
      }
      return (
        <Text
          style={titleStyle}
          minPresenceAhead={pdfMinPresenceHint(block.id, minPresence)}
          break={breakHint}
        >
          {content.text}
        </Text>
      )
    }
    case 'paragraph':
      return (
        <Text style={{ ...sheet.body, ...wrapper }} wrap={wrapHint} break={breakHint}>
          {content.text}
        </Text>
      )
    case 'skillGroup':
      return (
        <View style={wrapper} wrap={false} break={breakHint}>
          {content.name ? (
            <Text style={{ ...sheet.subheading, marginBottom: resolved.layout.bulletGapPt }}>
              {content.name}
            </Text>
          ) : null}
          {usesSkillGrid(resolved.layout) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {content.items.map((item, i) => (
                <Text
                  key={i}
                  style={{
                    ...sheet.skillLine,
                    width: skillColumnWidth(resolved.layout),
                    paddingRight: skillGridGutterPt(resolved.layout),
                    marginBottom: skillGridRowGapPt(resolved.layout),
                  }}
                >
                  {item}
                </Text>
              ))}
            </View>
          ) : (
            content.itemLines.map((line, i) => (
              <Text
                key={i}
                style={{
                  ...sheet.skillLine,
                  marginBottom:
                    i < content.itemLines.length - 1 ? resolved.layout.bulletGapPt : 0,
                }}
                wrap
              >
                {line}
              </Text>
            ))
          )}
        </View>
      )
    case 'itemHeader':
      return (
        <View
          style={wrapper}
          wrap={false}
          break={breakHint}
          minPresenceAhead={pdfMinPresenceHint(block.id, 0) || undefined}
        >
          {content.dates && usesRail(resolved.layout) ? (
            <RailRowPdf dates={content.dates} sheet={sheet} resolved={resolved}>
              <Text style={sheet.subheading}>{content.title}</Text>
              {content.subtitle ? (
                <Text
                  style={{
                    ...sheet.italic,
                    marginTop: resolved.layout.itemSubtitleGapPt,
                  }}
                >
                  {content.subtitle}
                </Text>
              ) : null}
            </RailRowPdf>
          ) : content.dates ? (
            <View style={sheet.rowTight}>
              <View>
                <Text style={sheet.subheading}>{content.title}</Text>
                {content.subtitle ? (
                  <Text
                    style={{
                      ...sheet.italic,
                      marginTop: resolved.layout.itemSubtitleGapPt,
                    }}
                  >
                    {content.subtitle}
                  </Text>
                ) : null}
              </View>
              <Text style={sheet.muted}>{content.dates}</Text>
            </View>
          ) : (
            <View>
              <Text style={sheet.subheading}>{content.title}</Text>
              {content.subtitle ? (
                <Text
                  style={{
                    ...sheet.skillLine,
                    marginTop: resolved.layout.itemSubtitleGapPt,
                  }}
                >
                  {content.subtitle}
                </Text>
              ) : null}
              {content.meta ? (
                <Text
                  style={{
                    ...sheet.muted,
                    marginTop: resolved.layout.itemSubtitleGapPt,
                  }}
                >
                  {content.meta}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      )
    case 'experienceItem':
      if (usesRail(resolved.layout)) {
        return (
          <View style={{ ...sheet.itemBlock, ...wrapper }} wrap={wrapHint} break={breakHint}>
            <RailRowPdf dates={content.dates} sheet={sheet} resolved={resolved}>
              <Text style={sheet.subheading}>{content.title}</Text>
              <Text
                style={{
                  ...sheet.italic,
                  marginTop: resolved.layout.itemSubtitleGapPt,
                }}
              >
                {content.company}
                {content.location ? `, ${content.location}` : ''}
              </Text>
              {content.bullets.map((bullet, i) => (
                <BulletRowPdf
                  key={i}
                  text={bullet}
                  sheet={sheet}
                  last={i === content.bullets.length - 1}
                />
              ))}
            </RailRowPdf>
          </View>
        )
      }
      return (
        <View style={{ ...sheet.itemBlock, ...wrapper }} wrap={wrapHint} break={breakHint}>
          <View style={sheet.row}>
            <View>
              <Text style={sheet.subheading}>{content.title}</Text>
              <Text
                style={{
                  ...sheet.italic,
                  marginTop: resolved.layout.itemSubtitleGapPt,
                }}
              >
                {content.company}
                {content.location ? `, ${content.location}` : ''}
              </Text>
            </View>
            <Text style={sheet.muted}>{content.dates}</Text>
          </View>
          {content.bullets.map((bullet, i) => (
            <BulletRowPdf
              key={i}
              text={bullet}
              sheet={sheet}
              last={i === content.bullets.length - 1}
            />
          ))}
        </View>
      )
    case 'educationItem':
      return (
        <View style={{ ...sheet.itemBlock, ...wrapper }} wrap={wrapHint ?? false} break={breakHint}>
          <View style={sheet.row}>
            <View>
              <Text style={sheet.subheading}>{content.institution}</Text>
              <Text>{content.degree}</Text>
            </View>
            <Text style={sheet.muted}>{content.dates}</Text>
          </View>
          {content.honors ? (
            <Text style={{ ...sheet.body, marginTop: resolved.layout.itemSubtitleGapPt }}>
              {content.honors}
            </Text>
          ) : null}
        </View>
      )
    case 'projectItem':
      return (
        <View style={{ ...sheet.itemBlock, ...wrapper }} wrap={wrapHint} break={breakHint}>
          <Text style={sheet.subheading}>{content.name}</Text>
          {content.description ? (
            <Text style={sheet.body}>{content.description}</Text>
          ) : null}
          {content.url ? (
            <Text style={sheet.muted}>{content.url.replace(/^https?:\/\//, '')}</Text>
          ) : null}
          {content.bullets.map((bullet, i) => (
            <BulletRowPdf
              key={i}
              text={bullet}
              sheet={sheet}
              last={i === content.bullets.length - 1}
            />
          ))}
        </View>
      )
    case 'bullet':
      return (
        <View
          style={{ ...wrapper, paddingLeft: bulletIndentPt(resolved.layout) }}
          wrap={wrapHint ?? true}
          break={breakHint}
        >
          <BulletRowPdf text={content.text} sheet={sheet} last />
        </View>
      )
    case 'referenceItem':
      return (
        <View style={{ ...sheet.itemBlock, ...wrapper }} wrap={wrapHint ?? false} break={breakHint}>
          <Text style={sheet.subheading}>{content.name}</Text>
          <Text style={sheet.body}>
            {content.title}, {content.company}
          </Text>
          {content.contactLine ? (
            <Text style={sheet.muted}>{content.contactLine}</Text>
          ) : null}
        </View>
      )
    default:
      return null
  }
}
