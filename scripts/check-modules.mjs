// Enforces the module map in .clear/architecture/modules.json.
//   pnpm run modules:check
// Production files only: *.test.* and src/test/ are integration tests and may import anything.
// Rules
//   P1  a package imports only the packages its entry in `packages` lists
//   P2  packages never import the application (`@/…`) or `@personal/…`
//   P3  the package graph has no cycle
//   M1  src/modules/<m> imports only the modules its entry in `modules` lists
//   M2  a cross-module import names the module entry (`@/modules/<m>`), never a file inside it
//   M3  the module graph has no cycle
//   M4  only src/app and the entry files at src/ may import `@/app`
//   M5  production code in src/ lives in src/modules/<m>, src/shared or src/app (entry files at src/ excepted),
//       and a module never imports anything else under src/
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SPEC = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"]+)['"]/g
const isTest = (f) => /\.test\.[cm]?[tj]sx?$/.test(f) || f.startsWith('src/test/')
const norm = (p) => p.split(path.sep).join('/')

/** Which module or package a repo-relative file belongs to. */
function owner(file) {
  let m = /^packages\/([^/]+)\/src\//.exec(file)
  if (m) return { kind: 'package', name: m[1] }
  m = /^src\/modules\/([^/]+)\//.exec(file)
  if (m) return { kind: 'module', name: m[1] }
  if (file.startsWith('src/shared/')) return { kind: 'module', name: 'shared' }
  if (file.startsWith('src/app/')) return { kind: 'module', name: 'app' }
  if (/^src\/[^/]+$/.test(file)) return { kind: 'root', name: 'root' }
  if (file.startsWith('src/')) return { kind: 'undeclared', name: file.split('/')[1] }
  return null
}

/** Resolve an import specifier to { kind, name, deep } or null (third-party / asset). */
function target(spec, file) {
  let m = /^@rb\/([^/]+)(\/.*)?$/.exec(spec)
  if (m) return { kind: 'package', name: m[1] }
  if (spec.startsWith('@personal/')) return { kind: 'personal', name: 'personal' }
  let rest = null
  if (spec.startsWith('@/')) rest = spec.slice(2)
  else if (spec.startsWith('.')) {
    const abs = norm(path.posix.join(path.posix.dirname(file), spec))
    const pkg = /^packages\/([^/]+)\/src(?:\/|$)/.exec(abs)
    if (pkg) return { kind: 'package', name: pkg[1] }
    if (abs.startsWith('src/')) rest = abs.slice(4)
    else return null
  }
  if (rest === null) return null
  m = /^modules\/([^/]+)(\/.*)?$/.exec(rest)
  if (m) return { kind: 'module', name: m[1], deep: Boolean(m[2]) }
  if (rest === 'shared' || rest.startsWith('shared/')) return { kind: 'module', name: 'shared', deep: false }
  if (rest === 'app' || rest.startsWith('app/')) return { kind: 'module', name: 'app', deep: false }
  return { kind: 'root', name: rest.split('/')[0] }
}

/** Strongly connected components with more than one node (Tarjan). */
function cycles(graph) {
  let index = 0
  const idx = new Map()
  const low = new Map()
  const stack = []
  const on = new Set()
  const out = []
  const visit = (v) => {
    idx.set(v, index)
    low.set(v, index)
    index++
    stack.push(v)
    on.add(v)
    for (const w of graph.get(v) ?? []) {
      if (!idx.has(w)) {
        visit(w)
        low.set(v, Math.min(low.get(v), low.get(w)))
      } else if (on.has(w)) {
        low.set(v, Math.min(low.get(v), idx.get(w)))
      }
    }
    if (low.get(v) === idx.get(v)) {
      const scc = []
      let w
      do {
        w = stack.pop()
        on.delete(w)
        scc.push(w)
      } while (w !== v)
      if (scc.length > 1) out.push(scc.sort())
    }
  }
  for (const v of graph.keys()) if (!idx.has(v)) visit(v)
  return out
}

/**
 * @param {{ path: string, source: string }[]} files repo-relative paths with '/' separators
 * @param {{ packages: Record<string,string[]>, modules: Record<string,string[]> }} config
 * @returns {{ rule: string, file: string, spec?: string, message: string }[]}
 */
export function checkModules(files, config) {
  const violations = []
  const pkgGraph = new Map(Object.keys(config.packages).map((k) => [k, new Set()]))
  const modGraph = new Map(Object.keys(config.modules).map((k) => [k, new Set()]))
  const add = (rule, file, spec, message) => violations.push({ rule, file, spec, message })

  for (const { path: file, source } of files) {
    if (isTest(file)) continue
    const from = owner(file)
    if (!from) continue
    if (from.kind === 'package' && !(from.name in config.packages)) {
      add('P1', file, undefined, `package "${from.name}" is not declared in modules.json`)
      continue
    }
    if (from.kind === 'module' && !(from.name in config.modules)) {
      add('M1', file, undefined, `module "${from.name}" is not declared in modules.json`)
      continue
    }
    if (from.kind === 'undeclared') {
      add('M5', file, undefined, `src/${from.name}/ is not a module: move it into src/modules/<name>/ or src/shared/`)
      continue
    }
    for (const match of source.matchAll(SPEC)) {
      const spec = match[1]
      const to = target(spec, file)
      if (!to) continue

      if (from.kind === 'package') {
        if (to.kind === 'module' || to.kind === 'root' || to.kind === 'personal') {
          add('P2', file, spec, 'packages must not import the application or the personal pack')
        } else if (to.name !== from.name) {
          pkgGraph.get(from.name).add(to.name)
          if (!config.packages[from.name].includes(to.name)) {
            add('P1', file, spec, `package "${from.name}" may not import "${to.name}"`)
          }
        }
        continue
      }

      if (to.kind === 'root') {
        if (from.kind === 'module') add('M5', file, spec, `module "${from.name}" may not import src/${to.name}, which is outside every module`)
        continue
      }
      if (to.kind !== 'module') continue
      if (from.kind === 'module' && to.name === from.name) continue
      if (to.name === 'app') {
        if (from.kind === 'module' && from.name !== 'app') {
          add('M4', file, spec, `module "${from.name}" may not import the app`)
        }
        continue
      }
      if (from.kind === 'module') {
        modGraph.get(from.name)?.add(to.name)
        const allowed = config.modules[from.name]
        if (!allowed.includes('*') && !allowed.includes(to.name)) {
          add('M1', file, spec, `module "${from.name}" may not import "${to.name}"`)
        }
      }
      if (to.deep && to.name !== 'shared') {
        add('M2', file, spec, `import the module entry "@/modules/${to.name}", not a file inside it`)
      }
    }
  }

  for (const scc of cycles(pkgGraph)) add('P3', scc[0], undefined, `package cycle: ${scc.join(' <-> ')}`)
  for (const scc of cycles(modGraph)) add('M3', scc[0], undefined, `module cycle: ${scc.join(' <-> ')}`)
  return violations
}

export function collect(root) {
  const out = []
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules') continue
      const p = path.join(dir, e.name)
      if (e.isDirectory()) walk(p)
      else if (/\.[cm]?[tj]sx?$/.test(e.name) && !e.name.endsWith('.d.ts')) {
        out.push({ path: norm(path.relative(root, p)), source: fs.readFileSync(p, 'utf8') })
      }
    }
  }
  for (const d of ['src', 'packages']) if (fs.existsSync(path.join(root, d))) walk(path.join(root, d))
  return out
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const config = JSON.parse(fs.readFileSync(path.join(root, '.clear/architecture/modules.json'), 'utf8'))
  const violations = checkModules(collect(root), config)
  if (violations.length === 0) {
    console.log('modules:check — no violations')
  } else {
    for (const v of violations) console.error(`${v.rule} ${v.file}${v.spec ? `  ${v.spec}` : ''}\n    ${v.message}`)
    console.error(`\nmodules:check — ${violations.length} violation(s)`)
    process.exit(1)
  }
}
