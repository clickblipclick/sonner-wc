import { $ } from 'bun';
import { rm } from 'node:fs/promises';

await rm('./dist', { recursive: true, force: true });

// ESM build for npm consumers
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: 'esm',
  target: 'browser',
  minify: false,
  sourcemap: 'linked',
  naming: 'sonner-wc.js',
});

// Self-contained IIFE-flavored ESM bundle for <script type="module" src=...> drop-in
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: 'esm',
  target: 'browser',
  minify: true,
  sourcemap: 'linked',
  naming: 'sonner-wc.bundle.js',
});

// Type declarations
await $`bunx tsc -p tsconfig.json`.quiet().nothrow();

console.log('built dist/');
