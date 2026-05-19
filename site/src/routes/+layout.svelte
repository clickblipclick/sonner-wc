<script lang="ts">
  import '../app.css';
  import Topbar from '$lib/components/Topbar.svelte';
  import { page } from '$app/state';
  let { children } = $props();

  const SITE_ORIGIN = 'https://clickblipclick.github.io';
  const SITE_DESC =
    "Sonner's toast UX as a framework-agnostic Web Component. Drop it into anything — vanilla HTML, React, Vue, Svelte — same API, same look, no framework dependencies.";
  const canonical = $derived(SITE_ORIGIN + page.url.pathname);
</script>

<svelte:head>
  <title>sonner-wc — Sonner's toast UX as a Web Component</title>
  <meta name="description" content={SITE_DESC} />
  <link rel="canonical" href={canonical} />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="sonner-wc" />
  <meta property="og:title" content="sonner-wc — Sonner's toast UX as a Web Component" />
  <meta property="og:description" content={SITE_DESC} />
  <meta property="og:url" content={canonical} />

  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="sonner-wc — Sonner's toast UX as a Web Component" />
  <meta name="twitter:description" content={SITE_DESC} />
</svelte:head>

<div class="flex min-h-screen flex-col">
  <Topbar />
  <main class="flex-1">
    {@render children()}
  </main>
</div>
