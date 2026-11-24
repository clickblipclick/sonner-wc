<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { prevNext } from '#lib/nav.ts';
  // Route ids are independent of the base path, so they match the hrefs in
  // nav.ts directly ('/docs/install', not '/sonner-wc/docs/install').
  const nav = $derived(prevNext(page.route.id ?? ''));
</script>

<nav class="mt-12 flex items-center justify-between border-t border-base-300 pt-6 text-sm">
  <div>
    {#if nav.prev}
      <a class="text-base-content/70 hover:text-base-content" href={resolve(nav.prev.href)}>
        ← {nav.prev.label}
      </a>
    {/if}
  </div>
  <div>
    {#if nav.next}
      <a class="text-base-content/70 hover:text-base-content" href={resolve(nav.next.href)}>
        {nav.next.label} →
      </a>
    {/if}
  </div>
</nav>
