module.exports = {
    parser: 'babel-eslint',
    extends: [
        'eslint:recommended',
        'plugin:react/recommended'
    ],
    parserOptions: {
        ecmaVersion: 6,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        node: true,
        jest: true,
    },
    plugins: [
        'react'
    ],
    rules: {
        semi: 'error',
        'comma-dangle': ['error', 'always-multiline'],
        'jsx-quotes': ['warn', 'prefer-double'],
        quotes: ['error', 'single', { 'avoidEscape': true, 'allowTemplateLiterals': true }],
        indent: ['error', 4, { SwitchCase: 1 }],
        'no-unused-vars': ['error', { args: 'none' }],
        'no-console': 'off'
    },
};