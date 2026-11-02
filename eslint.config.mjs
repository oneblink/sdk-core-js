import { defineConfig } from 'eslint/config'
import prettier from 'eslint-plugin-prettier'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import pluginSecurity from 'eslint-plugin-security'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

const pluginSecurityStrict = {
  ...pluginSecurity.configs.recommended,
  rules: Object.fromEntries(
    Object.keys(pluginSecurity.configs.recommended.rules).map((rule) => [
      rule,
      'error',
    ]),
  ),
}

export default defineConfig([
  {
    ignores: ['**/node_modules', '**/dist', '**/docs'],
  },
  {
    extends: [
      ...compat.extends(
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
      ),
      pluginSecurityStrict,
    ],

    plugins: {
      prettier,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: tsParser,
      ecmaVersion: 2024,
      sourceType: 'script',

      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
  },
])
