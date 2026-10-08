import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Conformance checks for the design system decision
 * (docs/decisions/shadcn-reui-design-system.md, Gold Standard hybrid-shadcn-reui).
 */

const root = path.resolve(import.meta.dirname, '../../..')
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8')
const posix = (p: string) => p.split(path.sep).join('/')

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = posix(path.join(dir, e.name))
    if (e.isDirectory()) walk(rel, out)
    else out.push(rel)
  }
  return out
}
const sourceFiles = () => walk('src').filter((f) => /\.(ts|tsx|css)$/.test(f))

describe('components.json', () => {
  it('declares the radix-nova style and the @reui registry (AC-2)', () => {
    const config = JSON.parse(read('components.json'))
    expect(config.style).toBe('radix-nova')
    expect(config.registries['@reui']).toContain('reui.io/r/{style}/{name}.json')
    expect(config.aliases.ui).toBe('@/shared/ui')
  })
})

describe('src/shared/ui', () => {
  const components = fs
    .readdirSync(path.join(root, 'src/shared/ui'))
    .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    .map((f) => f.replace(/\.tsx$/, ''))
  const manifest = JSON.parse(read('src/shared/ui/MANIFEST.json')) as Record<string, { origin: string }>

  it('has a provenance entry for every component (AC-3)', () => {
    expect(components.filter((c) => !(c in manifest))).toEqual([])
  })

  it('has no provenance entry for a missing component (AC-3)', () => {
    expect(Object.keys(manifest).filter((c) => !components.includes(c))).toEqual([])
  })

  it('records an origin of shadcn, reui or internal for each entry (AC-3)', () => {
    expect(Object.values(manifest).filter((e) => !['shadcn', 'reui', 'internal'].includes(e.origin))).toEqual([])
  })

  it('uses lowercase kebab-case file names, so Windows and Linux agree', () => {
    expect(components.filter((c) => c !== c.toLowerCase())).toEqual([])
  })
})

describe('primitive engines stay inside src/shared/ui (AC-4)', () => {
  it('lets no other file import radix-ui or @radix-ui/*, in any import form', () => {
    const IMPORT = /(?:from\s*|import\s*\(?\s*|require\s*\(\s*)['"](?:radix-ui|@radix-ui\/)/
    const offenders = [...sourceFiles(), ...walk('packages').filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes('node_modules'))]
      .filter((f) => !f.startsWith('src/shared/ui/'))
      .filter((f) => IMPORT.test(read(f)))
    expect(offenders).toEqual([])
  })
})

describe('tokens', () => {
  const css = read('src/shared/theme/tokens.css')

  type Oklch = { L: number; C: number; h: number; alpha: number }
  const block = (selector: string): Record<string, Oklch> => {
    const start = css.indexOf(`${selector} {`)
    const end = css.indexOf('}', start)
    const vars: Record<string, Oklch> = {}
    for (const m of css.slice(start, end).matchAll(/--([a-z-]+):\s*oklch\(([^)]+)\)/g)) {
      const [lch, alpha] = m[2].split('/').map((s) => s.trim())
      const [L, C, h] = lch.split(/\s+/).map(Number)
      vars[m[1]] = { L, C, h, alpha: alpha ? parseFloat(alpha) / 100 : 1 }
    }
    return vars
  }
  const light = block(':root')
  const dark = block('.dark')

  const SEMANTIC = [
    'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
    'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
    'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input', 'ring',
    'success', 'success-foreground', 'info', 'info-foreground', 'warning', 'warning-foreground',
    'invert', 'invert-foreground', 'focus', 'focus-foreground', 'paper', 'paper-foreground',
  ]

  it('defines every semantic token in the light theme (AC-7)', () => {
    expect(SEMANTIC.filter((t) => !(t in light))).toEqual([])
  })

  it('defines every semantic token in the dark theme (AC-7)', () => {
    expect(SEMANTIC.filter((t) => !(t in dark))).toEqual([])
  })

  // OKLCH -> sRGB -> WCAG relative luminance
  const toSrgb = ({ L, C, h }: Oklch): number[] => {
    const a = C * Math.cos((h * Math.PI) / 180)
    const b = C * Math.sin((h * Math.PI) / 180)
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
    const lin = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ].map((x) => Math.min(1, Math.max(0, x)))
    return lin.map((x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055))
  }
  const decode = (x: number) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
  const luminance = (rgb: number[]) => {
    const [r, g, b] = rgb.map(decode)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a: number[], b: number[]) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
    return (hi + 0.05) / (lo + 0.05)
  }
  const over = (fg: Oklch, alpha: number, bg: Oklch) => toSrgb(fg).map((v, i) => v * alpha + toSrgb(bg)[i] * (1 - alpha))

  type Pair = { name: string; fg: number[]; bg: number[]; min: number }
  const pairs = (t: Record<string, Oklch>, theme: 'light' | 'dark'): Pair[] => {
    const px = (k: string) => toSrgb(t[k])
    const out: Pair[] = [
      { name: 'foreground on background', fg: px('foreground'), bg: px('background'), min: 4.5 },
      { name: 'card-foreground on card', fg: px('card-foreground'), bg: px('card'), min: 4.5 },
      { name: 'popover-foreground on popover', fg: px('popover-foreground'), bg: px('popover'), min: 4.5 },
      { name: 'primary-foreground on primary', fg: px('primary-foreground'), bg: px('primary'), min: 4.5 },
      { name: 'secondary-foreground on secondary', fg: px('secondary-foreground'), bg: px('secondary'), min: 4.5 },
      { name: 'accent-foreground on accent', fg: px('accent-foreground'), bg: px('accent'), min: 4.5 },
      { name: 'paper-foreground on paper', fg: px('paper-foreground'), bg: px('paper'), min: 4.5 },
      { name: 'muted-foreground on background', fg: px('muted-foreground'), bg: px('background'), min: 4.5 },
      { name: 'muted-foreground on muted', fg: px('muted-foreground'), bg: px('muted'), min: 4.5 },
      { name: 'destructive text on background', fg: px('destructive'), bg: px('background'), min: 4.5 },
      { name: 'primary text on background', fg: px('primary'), bg: px('background'), min: 4.5 },
      { name: 'input edge on background (WCAG 1.4.11)', fg: px('input'), bg: px('background'), min: 3 },
      { name: 'ring on background (WCAG 1.4.11)', fg: px('ring'), bg: px('background'), min: 3 },
    ]
    for (const status of ['success', 'info', 'warning', 'destructive'] as const) {
      const fgToken = `${status}-foreground`
      out.push({ name: `${status} icon (${fgToken}) on background`, fg: px(fgToken), bg: px('background'), min: 3 })
      if (theme === 'light') {
        out.push({
          name: `${fgToken} on ${status}/10 (light tint)`,
          fg: px(fgToken),
          bg: over(t[status], 0.1, t.background),
          min: 4.5,
        })
      } else {
        out.push({
          name: `${status} on ${status}/15 (dark tint)`,
          fg: px(status),
          bg: over(t[status], 0.15, t.background),
          min: 4.5,
        })
      }
    }
    out.push({
      name: 'destructive on destructive tint (button)',
      fg: px('destructive'),
      bg: over(t.destructive, theme === 'light' ? 0.1 : 0.2, t.background),
      min: 4.5,
    })
    return out
  }

  const failures = (list: Pair[]) =>
    list
      .map((p) => ({ ...p, got: ratio(p.fg, p.bg) }))
      .filter((p) => p.got < p.min)
      .map((p) => `${p.name}: ${p.got.toFixed(2)} < ${p.min}`)

  it('meets WCAG contrast for every foreground and background pair in the light theme (AC-8)', () => {
    expect(failures(pairs(light, 'light'))).toEqual([])
  })

  it('meets WCAG contrast for every foreground and background pair in the dark theme (AC-9)', () => {
    expect(failures(pairs(dark, 'dark'))).toEqual([])
  })
})

describe('retired design system (AC-5, AC-6)', () => {
  it('leaves no UDS-only token utility in src', () => {
    const UDS_ONLY = /(?:bg|text|border|ring|fill|stroke)-(?:status-(?:success|warning|danger|info)|badge-[a-z]+|header|overlay-surface|primary-hover|canvas)|var\(--(?:duration|ease|shadow)-(?:fast|state|popover|overlay|raised|menu|modal|standard|emphasis)\)|shadow-\[var\(--shadow|duration-\[var\(|(?:^|[\s'"`:])shadow-(?:raised|menu|modal)(?![\w-])|(?:^|[\s'"`:])duration-(?:fast|state|popover|overlay)(?![\w-])/
    const offenders = sourceFiles()
      .filter((f) => !f.endsWith('design-system.test.ts'))
      .filter((f) => UDS_ONLY.test(read(f)))
    expect(offenders).toEqual([])
  })

  it('no longer ships the vendored UDS or its sync script', () => {
    expect(fs.existsSync(path.join(root, 'packages/styles/src/uds'))).toBe(false)
    expect(fs.existsSync(path.join(root, 'scripts/sync-uds.mjs'))).toBe(false)
  })
})

describe('feature code stays on the design system', () => {
  it('asks through ConfirmDialog and toast, never window.confirm or window.alert', () => {
    const offenders = sourceFiles()
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts') && !f.endsWith('.test.tsx'))
      .filter((f) => /(^|[^.\w])(?:window\.|globalThis\.)?(?:confirm|alert)\(/.test(read(f)))
    expect(offenders).toEqual([])
  })

  it('does not reference the removed AI feature (AC-1)', () => {
    const offenders = sourceFiles()
      .filter((f) => !f.endsWith('design-system.test.ts'))
      .filter((f) => /idrizz|\/api\/ai|react-markdown|OPENCODE/i.test(read(f)))
    expect(offenders).toEqual([])
  })
})

describe('registry code that we changed on purpose', () => {
  it('lets accordion content grow with its content and does not clip it', () => {
    const src = read('src/shared/ui/accordion.tsx')
    // Radix measures the content height once, when it opens; a fixed height or a clip cuts off later growth
    // (an added role, a growing textarea, an error message) and the picker dropdown.
    expect(src).not.toMatch(/h-\(--radix-accordion-content-height\)/)
    expect(src).not.toMatch(/overflow-hidden/)
  })

  it('records every modified component in MANIFEST.json', () => {
    const manifest = JSON.parse(read('src/shared/ui/MANIFEST.json')) as Record<string, { modified?: boolean; modification?: string }>
    const missing = Object.entries(manifest).filter(([, e]) => e.modified && !e.modification).map(([k]) => k)
    expect(missing).toEqual([])
  })
})
