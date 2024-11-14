import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import pluginVitest from '@vitest/eslint-plugin'
import pluginPlaywright from 'eslint-plugin-playwright'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

import json from '@eslint/json'
import markdown from '@eslint/markdown'

export default [
  {
    plugins: {
      json,
    },
  },

  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,ts,jsx,tsx,cjs,cts,mjs,mts,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  // lint JSON files
  {
    files: ['**/*.json'],
    language: 'json/json',
    rules: {
      'json/no-duplicate-keys': 'error',
    },
  },

  // lint Markdown files
  {
    files: ['**/*.md'],
    plugins: {
      markdown,
    },
    language: 'markdown/commonmark',
    rules: {
      'markdown/no-html': 'error',
    },
  },

  {
    plugins: {
      ...pluginVue.configs['flat/essential'],
    },
    files: ['**/*.vue'],
  },

  ...vueTsEslintConfig(),

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  skipFormatting,
]
