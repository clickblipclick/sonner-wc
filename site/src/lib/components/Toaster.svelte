<script lang="ts">
  import { onMount } from 'svelte';

  type Props = {
    position?: string;
    richColors?: boolean;
    // Pin to a fixed theme; omit to track the site's data-theme.
    theme?: 'light' | 'dark';
  };
  let { position = 'bottom-right', richColors = false, theme: pinnedTheme }: Props = $props();

  // Map the site's data-theme on <html> to the WC's theme attribute.
  // The site already resolves prefers-color-scheme into sonner-light/sonner-dark
  // via the pre-paint script in app.html, so we don't need theme="system" here.
  let observedTheme = $state<'light' | 'dark'>('light');
  const theme = $derived(pinnedTheme ?? observedTheme);

  function readTheme(): 'light' | 'dark' {
    const t = document.documentElement.getAttribute('data-theme');
    return t === 'sonner-dark' ? 'dark' : 'light';
  }

  onMount(() => {
    void import('$lib/sonner-wc');
    if (pinnedTheme) return;
    observedTheme = readTheme();
    const obs = new MutationObserver(() => {
      observedTheme = readTheme();
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  });
</script>

<sonner-toaster {position} {theme} rich-colors={richColors || undefined}></sonner-toaster>
