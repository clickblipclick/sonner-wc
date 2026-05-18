<script lang="ts">
  import { onMount } from 'svelte';
  import Toaster from './Toaster.svelte';

  let toast: typeof import('$lib/sonner-wc').toast | undefined = $state();

  onMount(async () => {
    const mod = await import('$lib/sonner-wc');
    toast = mod.toast;
  });
</script>

<div class="flex flex-wrap justify-center gap-2">
  <button class="btn btn-sm" onclick={() => toast?.('Event has been created.')}>
    toast()
  </button>
  <button class="btn btn-sm" onclick={() => toast?.success('Event has been created.')}>
    success
  </button>
  <button class="btn btn-sm" onclick={() => toast?.error('Something went wrong.')}>
    error
  </button>
  <button class="btn btn-sm" onclick={() => toast?.info('You have a new message.')}>
    info
  </button>
  <button class="btn btn-sm" onclick={() => toast?.warning('Storage almost full.')}>
    warning
  </button>
  <button
    class="btn btn-sm"
    onclick={() => toast?.loading('Uploading…', { duration: 2500 })}
  >
    loading
  </button>
</div>

<Toaster position="bottom-right" />
