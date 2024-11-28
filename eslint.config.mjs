import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {languageOptions: { globals: globals.node }},
  pluginJs.configs.recommended,
  {
  extends: [
    'standard', 
    'prettier'
    ],
  plugins: ['prettier'],
  rules: {
    camelcase: 'off',
    'prettier/prettier': 'error',
  },
}
];