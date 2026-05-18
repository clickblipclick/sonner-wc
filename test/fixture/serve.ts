/**
 * Static dev server for Playwright e2e tests.
 * - / and /index.html → fixture page
 * - /sonner-wc.js     → live bundle of src/index.ts
 * - /main.js          → live bundle of the fixture's wiring
 */
const FIXTURE_DIR = new URL('.', import.meta.url).pathname;
const PORT = Number(process.env.FIXTURE_PORT) || 4173;

const bundleCache = new Map<string, Promise<string>>();

function bundle(entry: string): Promise<string> {
  let pending = bundleCache.get(entry);
  if (pending) return pending;
  pending = (async () => {
    const res = await Bun.build({
      entrypoints: [entry],
      target: 'browser',
      format: 'esm',
      minify: false,
      sourcemap: 'inline',
    });
    if (!res.success || res.outputs.length === 0) {
      throw new AggregateError(res.logs, 'bundle failed');
    }
    return await res.outputs[0].text();
  })();
  bundleCache.set(entry, pending);
  return pending;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(Bun.file(`${FIXTURE_DIR}index.html`));
    }
    if (url.pathname === '/sonner-wc.js') {
      return new Response(await bundle(`${FIXTURE_DIR}../../src/index.ts`), {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    }
    if (url.pathname === '/main.js') {
      return new Response(await bundle(`${FIXTURE_DIR}main.ts`), {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
      });
    }
    return new Response('Not Found', { status: 404 });
  },
});

console.log(`fixture server: http://localhost:${server.port}`);
