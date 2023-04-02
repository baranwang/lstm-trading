require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: ['@rushstack/eslint-config/profile/node', 'plugin:prettier/recommended'],
  rules: {
    'prettier/prettier': ['error', require('./.prettierrc.json')],
    'no-console': ['error', { allow: ['warn', 'error'] }],
    '@typescript-eslint/typedef': 'off',
    '@typescript-eslint/parameter-properties': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports', disallowTypeAnnotations: false }],
    '@rushstack/typedef-var': 'off',
  },
};
