<script lang="ts">
  import LiveDemo from '$lib/components/LiveDemo.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { base } from '$app/paths';

  let { data } = $props();
  const installCmd = $derived(data.installCmd);
  const usageSnippet = $derived(data.usageSnippet);
  const installHtml = $derived(data.installHtml);
  const usageHtml = $derived(data.usageHtml);
</script>

<section class="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center">
  <h1 class="text-5xl font-semibold tracking-tight">sonner-wc</h1>
  <p class="mx-auto mt-4 max-w-xl text-lg text-base-content/70">
    Sonner's toast UX as a framework-agnostic Web Component. Drop it into
    anything — vanilla HTML, React, Vue, Svelte — same API, same look, no
    framework dependencies.
  </p>

  <div class="mt-8 flex items-center justify-center gap-3">
    <a class="btn btn-primary" href="{base}/docs/install">Get started</a>
    <a class="btn btn-outline" href="{base}/docs/api">API reference</a>
  </div>

  <div class="mt-8">
    <LiveDemo />
  </div>
</section>

<section class="mx-auto max-w-3xl px-4 pb-12">
  <div class="relative">
    <div class="install-snippet">
      {@html installHtml}
    </div>
    <div class="absolute right-2 top-2">
      <CopyButton text={installCmd} />
    </div>
  </div>
  <div class="mt-4 relative">
    {@html usageHtml}
    <div class="absolute right-2 top-2">
      <CopyButton text={usageSnippet} />
    </div>
  </div>
</section>

<section class="mx-auto grid max-w-5xl gap-6 px-4 pb-20 md:grid-cols-3">
  <div class="rounded-box border border-base-300 p-5">
    <h3 class="font-semibold">Drop in anywhere</h3>
    <p class="mt-2 text-sm text-base-content/70">
      One <code>&lt;script&gt;</code> from a CDN or one import from npm. No build
      step, no peer dependencies.
    </p>
  </div>
  <div class="rounded-box border border-base-300 p-5">
    <h3 class="font-semibold">Framework-agnostic</h3>
    <p class="mt-2 text-sm text-base-content/70">
      A standard custom element — React, Vue, Svelte, and plain HTML all talk to
      it the same way.
    </p>
  </div>
  <div class="rounded-box border border-base-300 p-5">
    <h3 class="font-semibold">Sonner parity</h3>
    <p class="mt-2 text-sm text-base-content/70">
      Stacking, hover-to-expand, swipe, themes, rich colors,
      <code>toast.promise()</code>, six positions.
    </p>
  </div>
</section>
