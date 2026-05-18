import { watch } from 'node:fs';

async function build() {
  await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    format: 'esm',
    target: 'browser',
    sourcemap: 'inline',
    naming: 'sonner-wc.js',
  });
}

await build();
console.log('built dist/sonner-wc.js');

watch('./src', { recursive: true }, async (_event, filename) => {
  console.log('rebuild:', filename);
  try {
    await build();
  } catch (err) {
    console.error(err);
  }
});
