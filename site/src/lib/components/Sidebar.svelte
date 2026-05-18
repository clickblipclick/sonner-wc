<script lang="ts">
  import { page } from '$app/state';
  import { docsNav } from '$lib/nav';
</script>

<aside
  class="min-h-full w-64 shrink-0 bg-base-100 lg:w-56 lg:border-r lg:border-base-300 lg:bg-transparent"
>
  <nav class="px-4 py-6">
    {#each docsNav as group}
      <div class="mb-6">
        <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-base-content/60">
          {group.title}
        </h4>
        <ul class="space-y-1">
          {#each group.items as item}
            {@const active = page.url.pathname === item.href}
            <li>
              <a
                href={item.href}
                class="block rounded px-2 py-1 text-sm {active
                  ? 'bg-base-200 font-medium text-base-content'
                  : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}"
              >
                {item.label}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>
</aside>
