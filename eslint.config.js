// @ts-check
import { defineConfig } from 'eslint/config'
import eslintPluginAstro from 'eslint-plugin-astro'
import tseslint from 'typescript-eslint'

export default defineConfig(
  {
    ignores: ['dist/**', '.astro/**', '.lighthouse/**', '.unlighthouse/**', 'content/**/*.md'],
  },
  tseslint.configs.recommended,
  eslintPluginAstro.configs['flat/recommended'],
)
