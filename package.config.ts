import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',

  // Resolved from the Studio at runtime — never inline these.
  deps: {
    neverBundle: ['react', 'react-dom', 'sanity', '@sanity/ui', '@sanity/icons'],
  },

  minify: true,
  sourcemap: false,
})
