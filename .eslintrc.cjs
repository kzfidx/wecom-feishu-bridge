/*
 ESLint configuration for Cloudflare Workers (ESM) project
 - Targets modern JS (ES2022)
 - Supports both Worker and Node environments (for build/tests and CJS modules in repo)
 - Integrates with Prettier (disables conflicting stylistic rules)
 - Enforces simple module boundaries between src/modules and src/utils
*/

module.exports = {
  root: true,
  env: {
    es2022: true,
    worker: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  extends: [
    'eslint:recommended',
    // Keep Prettier last to disable formatting-related ESLint rules
    'prettier'
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.mjs', '.cjs']
      }
    }
  },
  globals: {
    // Workers runtime globals commonly used in this codebase
    WebSocketPair: 'readonly',
    Response: 'readonly',
    Request: 'readonly',
    fetch: 'readonly',
    URL: 'readonly'
  },
  rules: {
    // Be lenient with unused function args (common in handler signatures)
    'no-unused-vars': ['error', { args: 'none', ignoreRestSiblings: true }]
  },
  overrides: [
    // Node-specific files (config, scripts)
    {
      files: ['*.cjs', 'wrangler.toml', '.eslintrc.*'],
      env: { node: true },
      parserOptions: { sourceType: 'script' }
    },
    // Enforce module boundaries for utils (no importing modules)
    {
      files: ['src/utils/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: ['../modules/*', '**/modules/*']
          }
        ],
        'no-restricted-modules': [
          'error',
          {
            patterns: ['../modules/*', '**/modules/*']
          }
        ]
      }
    },
    // Enforce module boundaries for modules (no importing app or index)
    {
      files: ['src/modules/**/*.js'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: ['../app.js', '../index.js']
          }
        ],
        'no-restricted-modules': [
          'error',
          {
            patterns: ['../app.js', '../index.js']
          }
        ]
      }
    }
  ]
};
