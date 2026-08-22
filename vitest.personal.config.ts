// Temporary config: runs the private personal/ scripts, which the main
// vitest config excludes from CI and product test runs.
import { defineConfig, defaultExclude } from 'vitest/config'
import base from './vite.config.ts'

export default defineConfig(async (env) => {
  const resolved = typeof base === 'function' ? await base(env) : base
  return {
    ...resolved,
    test: { ...resolved.test, exclude: [...defaultExclude] },
  }
})
