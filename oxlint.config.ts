import pluginKitOxlint from '@sanity/plugin-kit/oxlint'

export default {
  ...pluginKitOxlint,
  overrides: [
    {
      // scripts/ holds a Node CLI whose entire job is printing to stdout.
      files: ['scripts/**'],
      rules: {'no-console': 'off'},
    },
    {
      // `node:test` returns promises from `describe`/`test` by design and tracks them itself;
      // awaiting them at the top level is not how the runner is meant to be used.
      files: ['test/**'],
      rules: {'typescript/no-floating-promises': 'off'},
    },
  ],
}
