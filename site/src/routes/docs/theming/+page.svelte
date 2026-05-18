<script lang="ts">
  import ThemeWidget from '$lib/components/ThemeWidget.svelte';
</script>

<svelte:head><title>Theming · sonner-wc</title></svelte:head>

<h1>Theming</h1>

<h2>Light, dark, and system</h2>

<p>The toaster ships with two themes; <code>system</code> tracks <code>prefers-color-scheme</code>.</p>

<pre class="shiki"><code>{`<sonner-toaster theme="system"></sonner-toaster>`}</code></pre>

<h2>CSS custom properties</h2>

<p>Every color and dimension is a CSS custom property on the toaster. Override any of them in your own stylesheet:</p>

<pre class="shiki"><code>{`sonner-toaster {
  --normal-bg: #1a1a1a;
  --normal-border: #2a2a2a;
  --normal-text: #fafafa;
  --border-radius: 12px;
  --width: 400px;
}`}</code></pre>

<div class="overflow-x-auto">
  <table class="table table-sm">
    <thead><tr><th>Variable</th><th>Default (light)</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td><code>--width</code></td><td>356px</td><td>Toast width.</td></tr>
      <tr><td><code>--gap</code></td><td>14px</td><td>Vertical spacing in the expanded stack.</td></tr>
      <tr><td><code>--border-radius</code></td><td>8px</td><td>Toast corner radius.</td></tr>
      <tr><td><code>--normal-bg</code></td><td>#fff</td><td>Default toast background.</td></tr>
      <tr><td><code>--normal-border</code></td><td>var(--gray4)</td><td>Default border.</td></tr>
      <tr><td><code>--normal-text</code></td><td>var(--gray12)</td><td>Default text color.</td></tr>
      <tr><td><code>--success-bg / -border / -text</code></td><td>green triple</td><td>Success rich-color palette.</td></tr>
      <tr><td><code>--info-bg / -border / -text</code></td><td>blue triple</td><td>Info palette.</td></tr>
      <tr><td><code>--warning-bg / -border / -text</code></td><td>amber triple</td><td>Warning palette.</td></tr>
      <tr><td><code>--error-bg / -border / -text</code></td><td>red triple</td><td>Error palette.</td></tr>
      <tr><td><code>--offset-top/right/bottom/left</code></td><td>24px</td><td>Distance from viewport edges.</td></tr>
    </tbody>
  </table>
</div>

<h2>Rich colors</h2>

<p>Add the <code>rich-colors</code> attribute to color-code success / info / warning / error toasts:</p>

<pre class="shiki"><code>{`<sonner-toaster rich-colors></sonner-toaster>`}</code></pre>

<h2>Live theme preview</h2>

<p>Drag any control below; the toaster on this page picks up the change immediately. Click <em>Show toast</em> to verify.</p>

<ThemeWidget />
