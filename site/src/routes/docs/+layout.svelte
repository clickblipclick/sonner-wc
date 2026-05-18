<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  import PrevNext from '$lib/components/PrevNext.svelte';
  import { afterNavigate } from '$app/navigation';

  let { children } = $props();
  const TOGGLE_ID = 'docs-drawer';

  // Close the drawer after client-side navigations on mobile.
  afterNavigate(() => {
    const cb = document.getElementById(TOGGLE_ID) as HTMLInputElement | null;
    if (cb) cb.checked = false;
  });
</script>

<div class="drawer mx-auto max-w-6xl lg:drawer-open">
  <input id={TOGGLE_ID} type="checkbox" class="drawer-toggle" />

  <div class="drawer-content min-w-0 flex-1">
    <article class="prose prose-base mx-auto min-w-0 flex-1 px-4 py-10 lg:py-6 lg:px-10 lg:mx-0">
      {@render children()}
      <PrevNext />
    </article>
  </div>

  <div
    class="drawer-side z-40 lg:top-14 lg:z-auto lg:h-[calc(100dvh-3.5rem)]"
  >
    <label for={TOGGLE_ID} aria-label="Close docs navigation" class="drawer-overlay"></label>
    <Sidebar />
  </div>
</div>

<style>
  :global(article.prose h2) {
    margin-top: 2rem;
  }
  :global(article.prose pre.shiki) {
    margin: 1.25rem 0;
  }
</style>
