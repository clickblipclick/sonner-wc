<script lang="ts">
  import { page } from '$app/state';
  import { base } from '$app/paths';
  import { prevNext } from '$lib/nav';
  // Strip the base prefix when looking up neighbors so nav.ts can keep its
  // hrefs base-relative ('/docs/install', not '/sonner-wc/docs/install').
  const pathname = $derived(
    base && page.url.pathname.startsWith(base)
      ? page.url.pathname.slice(base.length) || '/'
      : page.url.pathname,
  );
  const nav = $derived(prevNext(pathname));
</script>

<nav class="mt-12 flex items-center justify-between border-t border-base-300 pt-6 text-sm">
  <div>
    {#if nav.prev}
      <a class="text-base-content/70 hover:text-base-content" href={`${base}${nav.prev.href}`}>
        ← {nav.prev.label}
      </a>
    {/if}
  </div>
  <div>
    {#if nav.next}
      <a class="text-base-content/70 hover:text-base-content" href={`${base}${nav.next.href}`}>
        {nav.next.label} →
      </a>
    {/if}
  </div>
</nav>
