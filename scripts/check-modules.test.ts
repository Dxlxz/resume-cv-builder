import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error plain ESM script, not part of the typechecked project
import { checkModules, collect } from './check-modules.mjs'

type Violation = { rule: string; file: string; spec?: string; message: string }
const config = {
  packages: { core: [], layout: ['core'], render: ['core', 'layout'] },
  modules: { shared: [], document: ['shared'], editor: ['document', 'shared'], app: ['*'] },
}
const run = (files: Record<string, string>): Violation[] =>
  checkModules(
    Object.entries(files).map(([p, source]) => ({ path: p, source })),
    config,
  )
const rules = (v: Violation[]) => v.map((x) => x.rule)

describe('checkModules', () => {
  it('accepts imports that follow the map', () => {
    expect(
      run({
        'packages/layout/src/a.ts': "import { x } from '@rb/core/types'",
        'packages/render/src/b.ts': "import { y } from '@rb/layout/types'\nimport { x } from '@rb/core/types'",
        'src/modules/editor/E.tsx': "import { s } from '@/modules/document'\nimport { b } from '@/shared/ui/Button'",
        'src/app/App.tsx': "import { e } from '@/modules/editor'",
      }),
    ).toEqual([])
  })

  it('P1: reports a package that imports a package it may not', () => {
    const v = run({ 'packages/layout/src/a.ts': "import { r } from '@rb/render/types'" })
    expect(v).toHaveLength(1)
    expect(v[0]).toMatchObject({ rule: 'P1', file: 'packages/layout/src/a.ts', spec: '@rb/render/types' })
  })

  it('P2: reports a package that imports the application', () => {
    expect(rules(run({ 'packages/core/src/a.ts': "import { s } from '@/modules/document'" }))).toEqual(['P2'])
  })

  it('P3: reports a package cycle', () => {
    const v = run({
      'packages/layout/src/a.ts': "import { r } from '@rb/render/types'",
      'packages/render/src/b.ts': "import { l } from '@rb/layout/types'",
    })
    expect(rules(v)).toContain('P3')
  })

  it('M1: reports a module that imports a module it may not', () => {
    const v = run({ 'src/modules/document/s.ts': "import { e } from '@/modules/editor'" })
    expect(rules(v)).toEqual(['M1'])
  })

  it('M2: reports a deep import into another module', () => {
    const v = run({ 'src/modules/editor/E.tsx': "import { s } from '@/modules/document/store/documentStore'" })
    expect(rules(v)).toEqual(['M2'])
  })

  it('M2: reports a relative import into another module', () => {
    const v = run({ 'src/modules/editor/E.tsx': "import { s } from '../document/store'" })
    expect(rules(v)).toEqual(['M2'])
  })

  it('M3: reports a module cycle', () => {
    const cyc = {
      packages: {},
      modules: { document: ['editor'], editor: ['document'] },
    }
    const v = checkModules(
      [
        { path: 'src/modules/document/a.ts', source: "import { e } from '@/modules/editor'" },
        { path: 'src/modules/editor/b.ts', source: "import { d } from '@/modules/document'" },
      ],
      cyc,
    )
    expect(rules(v)).toContain('M3')
  })

  it('M4: reports a module that imports the app', () => {
    expect(rules(run({ 'src/modules/editor/E.tsx': "import { A } from '@/app/App'" }))).toEqual(['M4'])
  })

  it('M5: reports a module importing a src directory outside every module', () => {
    const v = run({ 'src/modules/editor/E.tsx': "import { b } from '@/lib/bridge'" })
    expect(rules(v)).toEqual(['M5'])
    expect(rules(run({ 'src/modules/editor/E.tsx': "import { b } from '../../lib/bridge'" }))).toEqual(['M5'])
  })

  it('M5: reports production code in an undeclared src directory', () => {
    expect(rules(run({ 'src/lib/bridge.ts': "import { s } from '@/modules/document'" }))).toEqual(['M5'])
  })

  it('accepts the src entry files and test directory', () => {
    expect(
      run({
        'src/main.tsx': "import { App } from '@/app/App'",
        'src/test/setup.ts': "import { s } from '@/modules/document/documentStore'",
        'src/modules/editor/E.tsx': "import { s } from '@/modules/document'",
      }),
    ).toEqual([])
  })

  it('P1: reports a relative import that reaches into another package', () => {
    const v = run({ 'packages/layout/src/a.ts': "import { x } from '../../render/src/blocks/x'" })
    expect(v).toHaveLength(1)
    expect(v[0]).toMatchObject({ rule: 'P1', file: 'packages/layout/src/a.ts' })
  })

  it('P3: counts a relative cross-package import in the cycle check', () => {
    const v = run({
      'packages/layout/src/a.ts': "import { r } from '../../render/src/types'",
      'packages/render/src/b.ts': "import { l } from '@rb/layout/types'",
    })
    expect(rules(v)).toContain('P3')
  })

  it('M1: reports a relative import into a module that is not allowed', () => {
    expect(rules(run({ 'src/modules/document/s.ts': "import { e } from '../editor'" }))).toEqual(['M1'])
  })

  it('reports a package or module missing from the map', () => {
    expect(rules(run({ 'packages/new/src/a.ts': 'export {}' }))).toEqual(['P1'])
    expect(rules(run({ 'src/modules/new/a.ts': 'export {}' }))).toEqual(['M1'])
  })

  it('ignores test files and third-party imports', () => {
    expect(
      run({
        'packages/core/src/a.test.ts': "import { r } from '@rb/render/types'",
        'src/modules/document/b.ts': "import { create } from 'zustand'",
      }),
    ).toEqual([])
  })
})

describe('the repository', () => {
  it('follows .clear/architecture/modules.json', () => {
    const root = path.resolve(import.meta.dirname, '..')
    const cfg = JSON.parse(fs.readFileSync(path.join(root, '.clear/architecture/modules.json'), 'utf8'))
    const v = checkModules(collect(root), cfg) as Violation[]
    expect(v.map((x) => `${x.rule} ${x.file} ${x.spec ?? ''} ${x.message}`)).toEqual([])
  })
})
