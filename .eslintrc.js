module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
  rules: {
    '@typescript-eslint/ban-ts-ignore': 'off', // While in development
    '@typescript-eslint/no-explicit-any': 'off', // While in development
    '@typescript-eslint/no-use-before-define': 'off'
  }
};
