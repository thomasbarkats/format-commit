const js = require('@eslint/js');

module.exports = [
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
      ecmaVersion: 12,
      sourceType: 'commonjs',
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
      'camelcase': 'warn',
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
      'object-curly-spacing': [
        'error',
        'always',
        {
          'arraysInObjects': false,
          'objectsInObjects': false
        }
      ]
    }
  }
];
