import js from '@eslint/js';
import globals from 'globals';
export default [
  {ignores:['**/node_modules/**','**/dist/**','.audit/**','.audit-build/**']},
  js.configs.recommended,
  {files:['server/**/*.js'],languageOptions:{sourceType:'commonjs',globals:globals.node},rules:{'no-unused-vars':'off'}},
  {files:['client/**/*.{js,jsx}'],languageOptions:{sourceType:'module',parserOptions:{ecmaFeatures:{jsx:true}},globals:globals.browser},rules:{'no-unused-vars':'off'}},
];
