<script lang="ts">
  import { onMount } from 'svelte';

  type Props = { run: (t: typeof import('#lib/sonner-wc.ts').toast) => void; label?: string };
  let { run, label = 'Run' }: Props = $props();
  let toast: typeof import('#lib/sonner-wc.ts').toast | undefined = $state();

  onMount(async () => {
    toast = (await import('#lib/sonner-wc.ts')).toast;
  });
</script>

<button class="btn btn-sm" onclick={() => toast && run(toast)}>{label}</button>
