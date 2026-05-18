<script lang="ts">
  import { onMount } from 'svelte';
  import Toaster from './Toaster.svelte';

  type Var = { name: string; type: 'color' | 'range'; value: string; min?: number; max?: number; unit?: string };

  const vars: Var[] = [
    { name: '--normal-bg', type: 'color', value: '#ffffff' },
    { name: '--normal-text', type: 'color', value: '#0a0a0a' },
    { name: '--normal-border', type: 'color', value: '#e4e4e7' },
    { name: '--description-color', type: 'color', value: '#3f3f3f' },
    { name: '--border-radius', type: 'range', value: '8', min: 0, max: 24, unit: 'px' },
    { name: '--width', type: 'range', value: '356', min: 240, max: 560, unit: 'px' },
  ];

  let items: Var[] = $state(vars.map((v) => ({ ...v })));
  let toast: typeof import('$lib/sonner-wc').toast | undefined = $state();

  function applyAll() {
    const t = document.querySelector('sonner-toaster') as HTMLElement | null;
    if (!t) return;
    for (const v of items) {
      t.style.setProperty(v.name, v.value + (v.unit ?? ''));
    }
  }

  function onInput(i: number, e: Event) {
    items[i].value = (e.target as HTMLInputElement).value;
    applyAll();
  }

  onMount(async () => {
    toast = (await import('$lib/sonner-wc')).toast;
    applyAll();
  });
</script>

<div class="not-prose rounded-box border border-base-300 bg-base-200 p-4">
  <div class="grid gap-3 sm:grid-cols-2">
    {#each items as v, i}
      <label class="flex items-center justify-between gap-3 text-sm">
        <span class="font-mono text-xs">{v.name}</span>
        {#if v.type === 'color'}
          <input type="color" value={v.value} oninput={(e) => onInput(i, e)} />
        {:else}
          <input
            type="range"
            min={v.min}
            max={v.max}
            value={v.value}
            oninput={(e) => onInput(i, e)}
            class="range range-xs"
          />
        {/if}
      </label>
    {/each}
  </div>
  <button
    type="button"
    class="btn btn-primary btn-sm mt-4"
    onclick={() => toast?.success('Saved!', { description: 'Live theme preview.' })}
  >
    Show toast
  </button>
</div>

<Toaster position="bottom-right" theme="light" />
