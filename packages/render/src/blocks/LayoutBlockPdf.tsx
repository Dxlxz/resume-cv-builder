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
    case 'sectionTitle':
      return (
        <Text
          style={{
            ...(content.isFirst ? sheet.sectionTitleFirst : sheet.sectionTitle),
            ...wrapper,
          }}
          minPresenceAhead={pdfMinPresenceHint(block.id, minPresence)}
          break={breakHint}
        >
          {content.text}
        </Text>
      )
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
          {content.itemLines.map((line, i) => (
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
          ))}
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
          {content.dates ? (
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
        <View style={wrapper} wrap={wrapHint ?? true} break={breakHint}>
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
