import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
  plugins: [tailwindcss(), sveltekit()],
  resolve: {
    alias: {
      $wc: path.resolve(__dirname, '../dist/sonner-wc.js'),
    },
  },
});
