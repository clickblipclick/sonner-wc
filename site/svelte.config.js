import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './mdsvex.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.md'],
  preprocess: [vitePreprocess(), mdsvex(mdsvexConfig)],
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
    // Set BASE_PATH at build time (e.g. '/sonner-wc' for GitHub Pages on a
    // project subpath). Empty in dev and on a root-served deploy.
    paths: { base: process.env.BASE_PATH ?? '' },
  },
};

export default config;
