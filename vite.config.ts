import path from 'node:path'
import { defineConfig, defaultExclude } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// @rb/* packages — TS source consumed directly (no build step). Alias
// keeps vite/vitest in sync with tsconfig paths; subpaths are prefix-matched.
const rbAliases = Object.fromEntries(
  ['core', 'layout', 'render', 'styles', 'templates', 'themes', 'validators', 'presets', 'catalog', 'fixtures', 'pipeline', 'typst'].map(
    (pkg) => [`@rb/${pkg}`, path.resolve(import.meta.dirname, `./packages/${pkg}/src`)],
  ),
)

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        ...rbAliases,
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      // `personal/` is the private workspace (Dale's pack + personal dev
      // scripts) — never part of CI or product test runs. defaultExclude
      // keeps dependency internals (e.g. zod's own tests) out.
      // `tmp/` holds scratch output and upstream clones used as reference —
      // never product tests.
      exclude: ['personal/**', 'tmp/**', ...defaultExclude],
    },
  }
})
