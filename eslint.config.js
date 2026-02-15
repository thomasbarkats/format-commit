import js from '@eslint/js';


const sharedRules = {
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
};

export default [
  {
    ignores: [
      'debug/**',
      '**/node_modules/**',
      '.git/**',
      '.vscode/**',
      'web/dist/**'
    ]
  },
  // CLI source (lib/)
  {
    files: ['**/*.js'],
    ignores: ['web/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly'
      }
    },
    rules: {
      ...sharedRules,
      'quotes': [
        'error',
        'single'
      ],
    }
  },
  // Web app (web/)
  {
    files: ['web/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        HTMLElement: 'readonly',
        IntersectionObserver: 'readonly'
      }
    },
    rules: {
      ...sharedRules,
      'quotes': [
        'error',
        'single',
        { 'avoidEscape': true }
      ],
      'no-unused-vars': [
        'error',
        { 'varsIgnorePattern': '^[A-Z]' }
      ],
    }
  }
];
