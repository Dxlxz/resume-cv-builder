import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * UDS contract gate: className strings must use semantic tokens.
 * Bans Tailwind palette-color utilities (bg-gray-300, text-red-500, …) in
 * JSX className literals — the UDS semantic-only usage rule (see
 * packages/styles/src/uds/README.md). Cheap static guard; dynamic strings
 * (template concat) are out of scope — audit remains the backstop.
 */
const noPrimitiveTailwind = {
	meta: {
		type: 'problem',
		docs: { description: 'Forbid Tailwind palette-color utilities in JSX className (UDS semantic-only rule)' },
		messages: {
			primitive: 'Use semantic tokens (bg-background / text-primary / border-border / status-*) instead of the primitive utility "{{ util }}" (UDS contract, packages/styles/src/uds/README.md).',
		},
		schema: [],
	},
	create(context) {
		const PALETTE =
			/(?:bg|text|border|ring|fill|stroke|decoration|outline|divide|from|via|to|accent|caret|shadow)-(?:gray|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d+)?/g
		return {
			JSXAttribute(node) {
				if (node.name.name !== 'className') return
				const v = node.value
				const lit =
					v?.type === 'Literal'
						? v
						: v?.type === 'JSXExpressionContainer' && v.expression.type === 'Literal'
							? v.expression
							: null
				if (!lit || typeof lit.value !== 'string') return
				PALETTE.lastIndex = 0
				const util = lit.value.match(PALETTE)?.[0]
				if (util) context.report({ node: lit, messageId: 'primitive', data: { util } })
			},
		}
	},
}

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
    files: ['**/*.{ts,tsx}'],
    plugins: { local: { rules: { 'no-primitive-tailwind': noPrimitiveTailwind } } },
    rules: { 'local/no-primitive-tailwind': 'error' },
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

