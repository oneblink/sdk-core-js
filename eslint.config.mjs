import { defineConfig } from 'eslint/config'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import pluginMicrosoftSdl from '@microsoft/eslint-plugin-sdl'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/docs',
      '**/eslint.config.mjs',
      '**/jest.config.js',
    ],
  },
  {
    extends: [
      ...pluginMicrosoftSdl.configs.recommended,
      ...compat.extends(
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ),
    ],

    plugins: {
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: 'script',

      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
  },
])
