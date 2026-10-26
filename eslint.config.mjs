import tseslint from "typescript-eslint";

const eslintConfig = tseslint.config(
  ...tseslint.configs.recommended,
  { ignores: [".next/**", "node_modules/**"] }
);

export default eslintConfig;
