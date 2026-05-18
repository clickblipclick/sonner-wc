<script lang="ts">
  type Props = { text: string };
  let { text }: Props = $props();
  let copied = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 1200);
    } catch (_) {
      /* ignore */
    }
  }
</script>

<button
  type="button"
  class="btn btn-xs border border-base-300 bg-base-100 text-base-content/80 hover:bg-base-200"
  onclick={copy}
>
  {copied ? 'Copied' : 'Copy'}
</button>
