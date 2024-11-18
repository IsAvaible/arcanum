export default {
  /*
   * Use the @commitlint/config-conventional config (see: https://www.conventionalcommits.org/en/v1.0.0/)
   */
  extends: ['@commitlint/config-conventional'],
  /*
   * Rules
   */
  rules: {
    'body-max-line-length': [0, 'always', 250],
  },
}
