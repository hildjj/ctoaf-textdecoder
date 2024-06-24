import js from '@cto.af/eslint-config/js.js';
import mjs from '@cto.af/eslint-config/mjs.js';

export default [
  ...js,
  ...mjs,
  {
    files: [
      '*.js',
    ],
    rules: {
      'n/prefer-global/buffer': 'off',
      'prefer-arrow-callback': 'off',
      'prefer-destructuring': 'off',
      'prefer-template': 'off',
    },
  },
  {
    files: [
      'eslint.config.mjs',
    ],
    rules: {
      'n/no-unsupported-features/es-syntax': 'off',
    },
  },
];
