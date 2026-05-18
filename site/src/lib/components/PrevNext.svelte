<script lang="ts">
  import { page } from '$app/state';
  import { prevNext } from '$lib/nav';
  const nav = $derived(prevNext(page.url.pathname));
</script>

<nav class="mt-12 flex items-center justify-between border-t border-base-300 pt-6 text-sm">
  <div>
    {#if nav.prev}
      <a class="text-base-content/70 hover:text-base-content" href={nav.prev.href}>
        ← {nav.prev.label}
      </a>
    {/if}
  </div>
  <div>
    {#if nav.next}
      <a class="text-base-content/70 hover:text-base-content" href={nav.next.href}>
        {nav.next.label} →
      </a>
    {/if}
  </div>
</nav>
