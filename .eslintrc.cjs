/* eslint-env node */
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:import/typescript',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
