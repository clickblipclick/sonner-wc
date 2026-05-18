<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import { page } from '$app/state';

  const isDocs = $derived(page.url.pathname.startsWith('/docs'));
</script>

<header
  class="sticky top-0 z-30 border-b border-base-300 bg-base-100/80 backdrop-blur"
>
  <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
    <div class="flex items-center gap-1 -ml-2">
      {#if isDocs}
        <label
          for="docs-drawer"
          class="btn btn-ghost btn-sm btn-square lg:hidden"
          aria-label="Toggle docs navigation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
      {/if}
      <a href="/" class="flex items-center gap-2 font-semibold tracking-tight">
        <span class="text-base-content text-nowrap">sonner-wc</span>
      </a>
    </div>
    <nav class="flex items-center gap-1">
      <a
        href="https://github.com/"
        target="_blank"
        rel="noopener"
        class="btn btn-ghost btn-sm"
        aria-label="GitHub"
      >
        GitHub
      </a>
      <ThemeToggle />
    </nav>
  </div>
</header>
