'use strict'

module.exports = {
  root: true,
  extends: '@cto.af',
  rules: {
    // Old node versions
    'prefer-template': 'off',
    'node/no-unsupported-features/node-builtins': 'off',
    'node/prefer-global/buffer': 'off',
    'prefer-arrow-callback': 'off',
  },
}
