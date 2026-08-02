import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, defaultExclude } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Private personal pack (Dale's profile) — dev/test only. Shipping builds
// apply no alias: `@personal/profile` stays an external dynamic import that
// rejects at runtime, profile features hide, and no personal data is bundled.
const personalEntry = path.resolve(import.meta.dirname, './personal/personal-profile.ts')
const hasPersonal = fs.existsSync(personalEntry)

// @rb/* packages — TS source consumed directly (no build step). Alias
// keeps vite/vitest in sync with tsconfig paths; subpaths are prefix-matched.
const rbAliases = Object.fromEntries(
  ['core', 'layout', 'render', 'styles', 'templates', 'themes', 'validators', 'presets', 'catalog', 'fixtures'].map(
    (pkg) => [`@rb/${pkg}`, path.resolve(__dirname, `./packages/${pkg}/src`)],
  ),
)

export default defineConfig(({ command }) => {
  const isBuild = command === 'build'

  return {
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        ...rbAliases,
        ...(hasPersonal && !isBuild ? { '@personal/profile': personalEntry } : {}),
      },
    },
    define: {
      // Shipping builds never expose the personal pack feature.
      __HAS_PERSONAL__: JSON.stringify(hasPersonal && !isBuild),
    },
    build: {
      rollupOptions: {
        // Never bundle the personal pack into product builds.
        external: ['@personal/profile'],
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      // `personal/` is the private workspace (Dale's pack + personal dev
      // scripts) — never part of CI or product test runs. defaultExclude
      // keeps dependency internals (e.g. zod's own tests) out.
      exclude: ['personal/**', ...defaultExclude],
    },
  }
})
