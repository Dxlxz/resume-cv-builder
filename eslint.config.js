import fs from 'node:fs'
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Semantic-token gate: className strings must use semantic tokens (Gold Standard hybrid-shadcn-reui
 * sections 7-8). Bans Tailwind palette-color utilities (bg-gray-300, text-red-500, ...) in JSX className
 * literals; use bg-background, text-primary, border-border, or a status variant instead. Cheap static
 * guard; dynamic strings (template concat) are out of scope.
 */
const noPrimitiveTailwind = {
	meta: {
		type: 'problem',
		docs: { description: 'Forbid Tailwind palette-color utilities in JSX className (semantic tokens only)' },
		messages: {
			primitive: 'Use semantic tokens (bg-background / text-primary / border-border / bg-muted) or a status variant instead of the primitive utility "{{ util }}" (docs/decisions/shadcn-reui-design-system.md).',
		},
		schema: [],
	},
	create(context) {
		const PALETTE =
			/(?:bg|text|border|ring|fill|stroke|decoration|outline|divide|from|via|to|accent|caret|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\d+)?/g
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

/**
 * Module boundaries, generated from the single module map (.clear/architecture/modules.json).
 * scripts/check-modules.mjs is the gate (it also checks cycles and relative imports); these rules give early
 * feedback in the editor for the common violations.
 */
const moduleMap = JSON.parse(fs.readFileSync(new URL('./.clear/architecture/modules.json', import.meta.url), 'utf8'))
const restrict = (patterns) => ({ 'no-restricted-imports': ['error', { patterns }] })
const boundaryRules = [
  ...Object.entries(moduleMap.packages).map(([pkg, allowed]) => ({
    files: [`packages/${pkg}/src/**/*.{ts,tsx}`],
    ignores: ['**/*.test.*'],
    rules: restrict([
      {
        group: Object.keys(moduleMap.packages)
          .filter((other) => other !== pkg && !allowed.includes(other))
          .flatMap((other) => [`@rb/${other}`, `@rb/${other}/**`]),
        message: `package "${pkg}" may import only: ${allowed.join(', ') || 'nothing'} (.clear/architecture/modules.json)`,
      },
      { group: ['@/**', '@personal/**'], message: 'packages must not import the application or the personal pack' },
    ]),
  })),
  ...Object.entries(moduleMap.modules)
    .filter(([name]) => name !== 'app')
    .map(([name, allowed]) => ({
      files: [name === 'shared' ? 'src/shared/**/*.{ts,tsx}' : `src/modules/${name}/**/*.{ts,tsx}`],
      ignores: ['**/*.test.*'],
      rules: restrict([
        ...(allowed.includes('*')
          ? []
          : [
              {
                group: Object.keys(moduleMap.modules)
                  .filter((other) => other !== 'app' && other !== 'shared' && other !== name && !allowed.includes(other))
                  .map((other) => `@/modules/${other}`),
                message: `module "${name}" may import only: ${allowed.join(', ') || 'nothing'} (.clear/architecture/modules.json)`,
              },
            ]),
        { group: ['@/modules/*/**'], message: "import a module through its entry, '@/modules/<module>'" },
        { group: ['@/app', '@/app/**'], message: 'only the app composes modules' },
      ]),
    })),
  {
    files: ['src/app/**/*.{ts,tsx}'],
    ignores: ['**/*.test.*'],
    rules: restrict([{ group: ['@/modules/*/**'], message: "import a module through its entry, '@/modules/<module>'" }]),
  },
]

export default defineConfig([
  globalIgnores(['dist', 'personal', 'tmp']),
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
    files: ['src/shared/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  ...boundaryRules,
])

