import js from '@eslint/js';

export default [
  {
    ignores: [
      'debug/**',
      'node_modules/**',
      '.git/**',
      '.vscode/**'
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      ...js.configs.recommended.rules,
      'indent': [
        'error',
        2,
        { 'SwitchCase': 1 }
      ],
      'linebreak-style': [
        'warn',
        'unix'
      ],
      'quotes': [
        'error',
        'single'
      ],
      'semi': [
        'error',
        'always'
      ],
      'eqeqeq': 'error',
      'no-else-return': 'error',
      'no-useless-return': 'error',
      'no-useless-catch': 'error',
      'eol-last': [
        'error',
        'always'
      ],
      'curly': 'error',
      'no-return-await': 'error',
      'dot-notation': 'error',
      'no-multi-spaces': 'warn',
      'require-await': 'warn',
      'keyword-spacing': [
        'error',
        {
          'before': true,
          'after': true
        }
      ],
      'func-call-spacing': [
        'error',
        'never'
      ],
    }
  }
];
