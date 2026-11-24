import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mdsvexConfig from './mdsvex.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Released library version, read from the package being documented so the site
// always shows what's actually published.
const { version } = JSON.parse(
  readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'),
);

export default defineConfig({
  define: {
    __PKG_VERSION__: JSON.stringify(version),
  },
  plugins: [
    tailwindcss(),
    sveltekit({
      extensions: ['.svelte', '.md'],
      preprocess: [vitePreprocess(), mdsvex(mdsvexConfig)],
      adapter: adapter({
        pages: 'build',
        assets: 'build',
        fallback: undefined,
        precompress: false,
        strict: true,
      }),
      // Set BASE_PATH at build time (e.g. '/sonner-wc' for GitHub Pages on a
      // project subpath). Empty in dev and on a root-served deploy.
      paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}` },
    }),
  ],
  resolve: {
    alias: {
      $wc: path.resolve(__dirname, '../dist/sonner-wc.js'),
    },
  },
});
