import globals from "globals";

<<<<<<< HEAD
/** @type {import('eslint').Linter.Config[]} */
export default [{ languageOptions: { globals: globals.node } }];
=======

/** @type {import('eslint').Linter.Config[]} */
export default [
  {languageOptions: { globals: globals.browser }},
];
>>>>>>> c1c12f5 (chore(ci): added linter file)
