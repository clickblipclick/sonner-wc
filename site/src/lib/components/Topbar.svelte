<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
  import { page } from '$app/state';
  import { base } from '$app/paths';

  const isDocs = $derived(page.url.pathname.startsWith(`${base}/docs`));
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
      <a href="{base}/" class="flex items-center gap-2 font-semibold tracking-tight">
        <span class="text-base-content text-nowrap">sonner-wc</span>
      </a>
    </div>
    <nav class="flex items-center gap-1">
      <a
        href="https://www.npmjs.com/package/sonner-wc"
        target="_blank"
        rel="noopener"
        class="btn btn-ghost btn-xs btn-square"
        aria-label="npm package"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M0 0v24h24V0H0zm19.2 19.2h-2.4v-9.6h-4.8v9.6H4.8V4.8h14.4v14.4z" />
        </svg>
      </a>
      <a
        href="https://github.com/clickblipclick/sonner-wc"
        target="_blank"
        rel="noopener"
        class="btn btn-ghost btn-xs btn-square"
        aria-label="GitHub repository"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.01c-3.2.7-3.87-1.37-3.87-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.04 11.04 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.12 3.04.74.8 1.18 1.82 1.18 3.08 0 4.42-2.69 5.39-5.25 5.68.41.36.77 1.06.77 2.14v3.17c0 .31.21.68.8.56C20.22 21.38 23.5 17.07 23.5 12 23.5 5.65 18.35.5 12 .5z"
          />
        </svg>
      </a>
      <ThemeToggle />
    </nav>
  </div>
</header>
