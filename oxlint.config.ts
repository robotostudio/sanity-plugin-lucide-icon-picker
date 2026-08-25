import pluginKitOxlint from '@sanity/plugin-kit/oxlint'

export default {
  ...pluginKitOxlint,
  overrides: [
    {
      // scripts/ holds a Node CLI whose entire job is printing to stdout.
      files: ['scripts/**'],
      rules: {'no-console': 'off'},
    },
  ],
}
