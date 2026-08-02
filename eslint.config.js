import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'personal']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // The ui/ facade is a component library (Radix aliases + primitives);
    // fast-refresh's only-export-components rule does not apply.
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/**',
                '@/components/**',
                '@/hooks/**',
                '@/lib/**',
                '@/renderers/**',
                '@rb/presets/**',
                '@rb/themes/**',
                '@rb/templates/**',
                '@rb/layout/**',
                '@rb/render/**',
                '@rb/styles/**',
                '@rb/validators/**',
                '@rb/catalog/**',
                '@rb/fixtures/**',
              ],
              message: 'core module must not import application, layout, theme, preset, renderer, style, validator, catalog, or fixture dependencies',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/layout/src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.*'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/app/**',
                '@/components/**',
                '@/hooks/**',
                '@/lib/**',
                '@/renderers/**',
                '@rb/catalog/**',
                '@rb/validators/**',
                '@rb/presets/**',
              ],
              message: 'layout module must not import UI chrome, PDF renderers, catalog, or validators',
            },
          ],
        },
      ],
    },
  },
])

