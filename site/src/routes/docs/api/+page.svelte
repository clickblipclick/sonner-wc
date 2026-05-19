<script lang="ts">
  import RunButton from '$lib/components/RunButton.svelte';
  import Toaster from '$lib/components/Toaster.svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const toastFn = $derived(data.toastFn);
  const promiseSnippet = $derived(data.promiseSnippet);
  const customSnippet = $derived(data.customSnippet);
  const dismissSnippet = $derived(data.dismissSnippet);
  const toastFnHtml = $derived(data.toastFnHtml);
  const promiseHtml = $derived(data.promiseHtml);
  const customHtml = $derived(data.customHtml);
  const dismissHtml = $derived(data.dismissHtml);
</script>

<svelte:head><title>API · sonner-wc</title></svelte:head>

<h1>API reference</h1>

<h2><code>&lt;sonner-toaster&gt;</code> attributes</h2>
<p>Configure the host element via HTML attributes. All are optional.</p>

<div class="overflow-x-auto">
  <table class="table table-sm">
    <thead>
      <tr><th>Attribute</th><th>Values</th><th>Default</th><th>Description</th></tr>
    </thead>
    <tbody>
      <tr><td><code>position</code></td><td><code>top-left</code> · <code>top-center</code> · <code>top-right</code> · <code>bottom-left</code> · <code>bottom-center</code> · <code>bottom-right</code></td><td><code>bottom-right</code></td><td>Where toasts appear relative to the viewport.</td></tr>
      <tr><td><code>theme</code></td><td><code>light</code> · <code>dark</code> · <code>system</code></td><td><code>light</code></td><td>Color theme. <code>system</code> tracks <code>prefers-color-scheme</code>.</td></tr>
      <tr><td><code>rich-colors</code></td><td>boolean (presence)</td><td>off</td><td>Colored success / error / warning / info variants.</td></tr>
      <tr><td><code>close-button</code></td><td>boolean (presence)</td><td>off</td><td>Show a close button on every toast.</td></tr>
      <tr><td><code>invert</code></td><td>boolean (presence)</td><td>off</td><td>Flip background and text against the current theme.</td></tr>
      <tr><td><code>dir</code></td><td><code>ltr</code> · <code>rtl</code> · <code>auto</code></td><td><code>auto</code></td><td>Text direction.</td></tr>
      <tr><td><code>gap</code></td><td>number (px)</td><td><code>14</code></td><td>Spacing between stacked toasts when expanded.</td></tr>
      <tr><td><code>duration</code></td><td>number (ms)</td><td><code>4000</code></td><td>Default lifetime; per-toast overrides win.</td></tr>
      <tr><td><code>visible-toasts</code></td><td>number</td><td><code>3</code></td><td>How many toasts are fully visible before fading.</td></tr>
      <tr><td><code>offset</code></td><td>CSS length</td><td><code>24px</code></td><td>Distance from viewport edges.</td></tr>
      <tr><td><code>mobile-offset</code></td><td>CSS length</td><td><code>16px</code></td><td>Edge distance under 600px viewport width.</td></tr>
      <tr><td><code>hotkey</code></td><td>chord string, <code>""</code>, or <code>"none"</code></td><td><code>altKey+KeyT</code></td><td>Keyboard chord that expands the stack. Empty / <code>none</code> disables it.</td></tr>
      <tr><td><code>expand</code></td><td>boolean (presence)</td><td>off</td><td>Force-expand the stack even without hover.</td></tr>
      <tr><td><code>container-aria-label</code></td><td>string</td><td><code>Notifications</code></td><td>Accessible name for the toaster region. Reactive — changes after mount take effect.</td></tr>
    </tbody>
  </table>
</div>

<h2><code>&lt;sonner-toast&gt;</code> attributes</h2>
<p>Per-toast overrides — any of these on an individual toast wins over the toaster default.</p>

<div class="overflow-x-auto">
  <table class="table table-sm">
    <thead><tr><th>Attribute</th><th>Values</th><th>Default</th><th>Description</th></tr></thead>
    <tbody>
      <tr><td><code>type</code></td><td><code>default</code> · <code>success</code> · <code>error</code> · <code>info</code> · <code>warning</code> · <code>loading</code></td><td><code>default</code></td><td>Visual variant and built-in icon.</td></tr>
      <tr><td><code>duration</code></td><td>number (ms) or <code>Infinity</code></td><td>inherits toaster</td><td>How long before auto-dismiss.</td></tr>
      <tr><td><code>dismissible</code></td><td><code>false</code> to opt out</td><td>true</td><td>Whether close button + swipe dismiss this toast.</td></tr>
      <tr><td><code>position</code></td><td>same as toaster</td><td>inherits toaster</td><td>Override position for one toast.</td></tr>
      <tr><td><code>close-button</code></td><td>boolean</td><td>inherits toaster</td><td>Show close button on this toast.</td></tr>
      <tr><td><code>rich-colors</code></td><td>boolean</td><td>inherits toaster</td><td>Force rich colors on this toast.</td></tr>
      <tr><td><code>invert</code></td><td>boolean</td><td>inherits toaster</td><td>Force inverted colors on this toast.</td></tr>
    </tbody>
  </table>
</div>

<h2><code>&lt;sonner-toast&gt;</code> slots</h2>

<div class="overflow-x-auto">
  <table class="table table-sm">
    <thead><tr><th>Slot</th><th>Purpose</th></tr></thead>
    <tbody>
      <tr><td><code>title</code></td><td>Primary text.</td></tr>
      <tr><td><code>description</code></td><td>Secondary text.</td></tr>
      <tr><td><code>icon</code></td><td>Override the icon picked from <code>type</code>.</td></tr>
      <tr><td><code>action</code></td><td>Right-aligned action button (e.g. Undo).</td></tr>
      <tr><td><code>cancel</code></td><td>Left-aligned cancel button.</td></tr>
      <tr><td>(default)</td><td>Used by <code>toast.custom()</code> for fully custom content.</td></tr>
    </tbody>
  </table>
</div>

<h2><code>toast()</code> options</h2>

<p>The second argument to <code>toast()</code> (and its variants) accepts:</p>

<div class="overflow-x-auto">
  <table class="table table-sm">
    <thead><tr><th>Option</th><th>Type</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td><code>id</code></td><td><code>string | number</code></td><td>Reuse to update a toast in place.</td></tr>
      <tr><td><code>toasterId</code></td><td><code>string</code></td><td>DOM <code>id</code> of a specific <code>&lt;sonner-toaster&gt;</code> to route this toast to. Falls back to the default toaster if no match.</td></tr>
      <tr><td><code>testId</code></td><td><code>string</code></td><td>Set as <code>data-testid</code> on the toast host. Survives promise transitions.</td></tr>
      <tr><td><code>closeButtonAriaLabel</code></td><td><code>string</code></td><td>Accessible name for the close button. Defaults to <code>Close: &lt;title&gt;</code>.</td></tr>
      <tr><td><code>description</code></td><td><code>string | Node | () =&gt; …</code></td><td>Secondary text.</td></tr>
      <tr><td><code>duration</code></td><td><code>number</code> or <code>Infinity</code></td><td>Lifetime override (ms).</td></tr>
      <tr><td><code>dismissible</code></td><td><code>boolean</code></td><td>Set <code>false</code> to disable swipe / close-button dismissal.</td></tr>
      <tr><td><code>position</code></td><td>same as toaster</td><td>Per-toast position override.</td></tr>
      <tr><td><code>closeButton</code></td><td><code>boolean</code></td><td>Per-toast override of the toaster's <code>close-button</code> flag.</td></tr>
      <tr><td><code>richColors</code> / <code>invert</code></td><td><code>boolean</code></td><td>Force the variant on this toast.</td></tr>
      <tr><td><code>icon</code></td><td><code>Node | string</code></td><td>Override the icon picked from <code>type</code>.</td></tr>
      <tr><td><code>className</code></td><td><code>string</code></td><td>Extra class applied to the toast host.</td></tr>
      <tr><td><code>action</code> / <code>cancel</code></td><td><code>&#123; label, onClick &#125;</code> or <code>HTMLElement</code></td><td>Right / left button. Pass an element for full control.</td></tr>
      <tr><td><code>onDismiss</code> / <code>onAutoClose</code></td><td><code>(el) =&gt; void</code></td><td>Lifecycle callbacks.</td></tr>
    </tbody>
  </table>
</div>

<h2>The <code>toast()</code> function</h2>

<div class="relative">
  {@html toastFnHtml}
  <div class="absolute right-2 top-2"><CopyButton text={toastFn} /></div>
</div>

<h3><code>toast.promise()</code></h3>

<div class="relative">
  {@html promiseHtml}
  <div class="absolute right-2 top-2"><CopyButton text={promiseSnippet} /></div>
</div>

<RunButton
  label="Run toast.promise (success)"
  run={(t) =>
    t.promise(
      new Promise((res) => setTimeout(() => res({ name: 'Sonner WC' }), 1500)),
      { loading: 'Loading…', success: (d: any) => `${d.name} loaded.`, error: 'Failed.' },
    )}
/>
<RunButton
  label="Run toast.promise (error)"
  run={(t) =>
    t.promise(
      new Promise((_, rej) => setTimeout(() => rej(new Error('Network down')), 1500)),
      { loading: 'Loading…', success: 'Loaded.', error: (e: any) => `Failed: ${e.message}` },
    )}
/>

<h3><code>toast.custom()</code></h3>

<div class="relative">
  {@html customHtml}
  <div class="absolute right-2 top-2"><CopyButton text={customSnippet} /></div>
</div>

<RunButton
  label="Run toast.custom"
  run={(t) =>
    t.custom((id) => {
      const el = document.createElement('div');
      el.style.cssText =
        'padding:16px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;font-weight:500;width:100%;box-sizing:border-box;';
      el.textContent = '✨ Custom toast #' + id;
      return el;
    })}
/>

<h3><code>toast.dismiss()</code></h3>

<p>Use the same <code>id</code> to update an existing toast in place. Pass no argument to dismiss everything.</p>

<div class="relative">
  {@html dismissHtml}
  <div class="absolute right-2 top-2"><CopyButton text={dismissSnippet} /></div>
</div>

<RunButton
  label="Update in place"
  run={(t) => {
    t.loading('Working…', { id: 'job-1' });
    setTimeout(() => t.success('Done', { id: 'job-1' }), 1500);
  }}
/>

<h2>Events</h2>

<p>Each toast dispatches the following bubbling, composed <code>CustomEvent</code>s:</p>

<div class="overflow-x-auto">
  <table class="table table-sm">
    <thead><tr><th>Event</th><th>When</th></tr></thead>
    <tbody>
      <tr><td><code>sonner-toast-mounted</code></td><td>After the mount transition begins.</td></tr>
      <tr><td><code>sonner-toast-updated</code></td><td>After <code>update()</code> applies (used by <code>toast.promise</code>).</td></tr>
      <tr><td><code>sonner-toast-dismissed</code></td><td>When <code>dismiss()</code> is called (before the exit animation finishes).</td></tr>
      <tr><td><code>sonner-toast-autoclosed</code></td><td>When the auto-dismiss timer fires.</td></tr>
    </tbody>
  </table>
</div>

<Toaster position="bottom-right" />
