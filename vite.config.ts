import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, defaultExclude } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { runAiProxy } from './api/ai.ts'

// Private personal pack (Dale's profile) — dev/test only. Shipping builds
// apply no alias: `@personal/profile` stays an external dynamic import that
// rejects at runtime, profile features hide, and no personal data is bundled.
// In test mode without the pack (CI, clean checkouts), the alias points at a
// stub so the dynamic import resolves; the feature stays off via
// `__HAS_PERSONAL__`.
const personalEntry = path.resolve(import.meta.dirname, './personal/personal-profile.ts')
const hasPersonal = fs.existsSync(personalEntry)

// @rb/* packages — TS source consumed directly (no build step). Alias
// keeps vite/vitest in sync with tsconfig paths; subpaths are prefix-matched.
const rbAliases = Object.fromEntries(
  ['core', 'layout', 'render', 'styles', 'templates', 'themes', 'validators', 'presets', 'catalog', 'fixtures'].map(
    (pkg) => [`@rb/${pkg}`, path.resolve(import.meta.dirname, `./packages/${pkg}/src`)],
  ),
)

export default defineConfig(({ command, mode }) => {
  const isBuild = command === 'build'
  const env = loadEnv(mode, import.meta.dirname, '')
  const personalAlias = !isBuild
    ? hasPersonal
      ? { '@personal/profile': personalEntry }
      : {
          '@personal/profile': path.resolve(
            import.meta.dirname,
            './src/test/stubs/personal-profile.ts',
          ),
        }
    : {}

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // Serves /api/ai in dev so the AI feature works without Vercel CLI.
        name: 'ai-proxy-dev',
        configureServer(server) {
          server.middlewares.use('/api/ai', async (req, res) => {
            let raw = ''
            for await (const chunk of req) raw += chunk
            let body: unknown
            try {
              body = raw ? JSON.parse(raw) : {}
            } catch {
              body = {}
            }
            const result = await runAiProxy(
              body,
              env.OPENCODE_GO_API_KEY ?? process.env.OPENCODE_GO_API_KEY,
            )
            res.statusCode = result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result.json))
          })
        },
      },
    ],
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        ...rbAliases,
        ...personalAlias,
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
