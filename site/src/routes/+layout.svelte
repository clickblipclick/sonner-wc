<script lang="ts">
  import '../app.css';
  import Topbar from '$lib/components/Topbar.svelte';
  let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
  <Topbar />
  <main class="flex-1">
    {@render children()}
  </main>
</div>
