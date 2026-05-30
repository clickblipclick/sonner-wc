<script lang="ts">
  import { onMount } from 'svelte';
  import CopyButton from '$lib/components/CopyButton.svelte';
  import { highlight } from '$lib/shiki';

  type Position =
    | 'top-left' | 'top-center' | 'top-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';
  type Theme = 'light' | 'dark' | 'system';
  type Dir = 'ltr' | 'rtl' | 'auto';

  const POSITIONS: Position[] = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];

  let toast: typeof import('$lib/sonner-wc').toast | undefined = $state();

  // Defaults mirror the documented API.
  let position: Position = $state('bottom-right');
  let theme: Theme = $state('light');
  let richColors = $state(false);
  let closeButton = $state(false);
  let expand = $state(false);
  let visibleToasts = $state(3);
  let duration = $state(4000);
  let invert = $state(false);
  let dir: Dir = $state('auto');
  let gap = $state(14);
  let offset = $state('24px');
  let mobileOffset = $state('16px');
  let hotkey = $state('altKey+KeyT');
  let containerAriaLabel = $state('Notifications');

  function reset() {
    position = 'bottom-right';
    theme = 'light';
    richColors = false;
    closeButton = false;
    expand = false;
    visibleToasts = 3;
    duration = 4000;
    invert = false;
    dir = 'auto';
    gap = 14;
    offset = '24px';
    mobileOffset = '16px';
    hotkey = 'altKey+KeyT';
    containerAriaLabel = 'Notifications';
  }

  const markupSnippet = $derived.by(() => {
    const attrs: string[] = [];
    if (position !== 'bottom-right') attrs.push(`position="${position}"`);
    if (theme !== 'light') attrs.push(`theme="${theme}"`);
    if (richColors) attrs.push('rich-colors');
    if (closeButton) attrs.push('close-button');
    if (expand) attrs.push('expand');
    if (visibleToasts !== 3) attrs.push(`visible-toasts="${visibleToasts}"`);
    if (duration !== 4000) attrs.push(`duration="${duration}"`);
    if (invert) attrs.push('invert');
    if (dir !== 'auto') attrs.push(`dir="${dir}"`);
    if (gap !== 14) attrs.push(`gap="${gap}"`);
    if (offset !== '24px') attrs.push(`offset="${offset}"`);
    if (mobileOffset !== '16px') attrs.push(`mobile-offset="${mobileOffset}"`);
    if (hotkey !== 'altKey+KeyT') attrs.push(`hotkey="${hotkey}"`);
    if (containerAriaLabel !== 'Notifications')
      attrs.push(`container-aria-label="${containerAriaLabel}"`);
    return attrs.length
      ? `<sonner-toaster\n  ${attrs.join('\n  ')}\n></sonner-toaster>`
      : `<sonner-toaster></sonner-toaster>`;
  });

  // --- Toast (per-invocation) options ---
  type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading';
  type Tri = 'inherit' | 'on' | 'off';

  let toastType: ToastType = $state('default');
  let toastTitle = $state('Event has been created');
  let toastDescription = $state('');
  let overrideDuration = $state(false);
  let toastDuration = $state(4000);
  let toastDismissible = $state(true);
  let toastCloseButton: Tri = $state('inherit');
  let toastRichColors: Tri = $state('inherit');
  let actionLabel = $state('');
  let cancelLabel = $state('');

  function resetToast() {
    toastType = 'default';
    toastTitle = 'Event has been created';
    toastDescription = '';
    overrideDuration = false;
    toastDuration = 4000;
    toastDismissible = true;
    toastCloseButton = 'inherit';
    toastRichColors = 'inherit';
    actionLabel = '';
    cancelLabel = '';
  }

  function fireToast() {
    if (!toast) return;
    const opts: Record<string, unknown> = {};
    if (toastDescription) opts.description = toastDescription;
    if (overrideDuration) opts.duration = toastDuration;
    if (!toastDismissible) opts.dismissible = false;
    if (toastCloseButton !== 'inherit') opts.closeButton = toastCloseButton === 'on';
    if (toastRichColors !== 'inherit') opts.richColors = toastRichColors === 'on';
    if (actionLabel)
      opts.action = { label: actionLabel, onClick: () => toast?.success('Action clicked.') };
    if (cancelLabel) opts.cancel = { label: cancelLabel, onClick: () => {} };
    const fn = toastType === 'default' ? toast : toast[toastType];
    fn(toastTitle, opts);
  }

  // Build the `toast()` call that reproduces the current options — the thing
  // a user actually copies into their app. Mirrors fireToast() exactly.
  const js = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const callSnippet = $derived.by(() => {
    const opts: string[] = [];
    if (toastDescription) opts.push(`description: ${js(toastDescription)}`);
    if (overrideDuration) opts.push(`duration: ${toastDuration}`);
    if (!toastDismissible) opts.push('dismissible: false');
    if (toastCloseButton !== 'inherit') opts.push(`closeButton: ${toastCloseButton === 'on'}`);
    if (toastRichColors !== 'inherit') opts.push(`richColors: ${toastRichColors === 'on'}`);
    if (actionLabel) opts.push(`action: { label: ${js(actionLabel)}, onClick: () => {} }`);
    if (cancelLabel) opts.push(`cancel: { label: ${js(cancelLabel)}, onClick: () => {} }`);
    const fn = toastType === 'default' ? 'toast' : `toast.${toastType}`;
    const title = js(toastTitle);
    return opts.length
      ? `${fn}(${title}, {\n  ${opts.join(',\n  ')},\n})`
      : `${fn}(${title})`;
  });

  let markupHtml = $state('');
  let callHtml = $state('');
  $effect(() => {
    const s = markupSnippet;
    void highlight(s, 'html').then((h) => (markupHtml = h));
  });
  $effect(() => {
    const s = callSnippet;
    void highlight(s, 'ts').then((h) => (callHtml = h));
  });

  onMount(async () => {
    const mod = await import('$lib/sonner-wc');
    toast = mod.toast;
  });

  let promiseSeq = 0;
  function firePromise(ok: boolean) {
    const i = ++promiseSeq;
    toast?.promise<{ name: string }>(
      new Promise<{ name: string }>((res, rej) =>
        setTimeout(() => (ok ? res({ name: `Job #${i}` }) : rej(new Error('Network down'))), 1500),
      ),
      {
        loading: 'Loading…',
        success: (d: { name: string }) => `${d.name} loaded.`,
        error: (e) => `Failed: ${(e as Error).message}`,
      },
    );
  }

  function fireCustom() {
    toast?.custom((id) => {
      const el = document.createElement('div');
      el.style.cssText =
        'padding:16px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:white;font-weight:500;width:100%;box-sizing:border-box;';
      el.textContent = '✨ Custom toast #' + id;
      return el;
    });
  }
</script>

<svelte:head><title>Playground · sonner-wc</title></svelte:head>

<!-- Readable label + the real API name (kebab attr or camelCase option key). -->
{#snippet lbl(text: string, api?: string, unit?: string)}
  <span class="text-sm font-medium">
    {text}{#if api}{' '}<span class="font-normal text-base-content/45">(<code class="text-xs">{api}</code>{#if unit}&nbsp;· {unit}{/if})</span>{/if}
  </span>
{/snippet}

<section class="mx-auto max-w-6xl px-4 py-8">
  <header class="reveal mb-8">
    <h1 class="text-3xl font-semibold tracking-tight">Playground</h1>
    <p class="mt-2 max-w-2xl text-base-content/70">
      Tweak every <code>&lt;sonner-toaster&gt;</code> attribute and toast option, fire it, and
      copy the exact markup and call. The output rail follows you as you scroll.
    </p>
  </header>

  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
    <!-- Configuration column -->
    <div class="grid gap-6">
      <!-- Toaster attributes -->
      <section class="reveal rounded-box border border-base-300 p-5" style="--d:60ms">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold">Toaster</h2>
            <p class="text-sm text-base-content/55">Element attributes — apply to every toast.</p>
          </div>
          <button class="btn btn-ghost btn-xs" onclick={reset}>Reset</button>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            {@render lbl('Position', 'position')}
            <select class="select select-sm select-bordered w-full" bind:value={position}>
              {#each POSITIONS as p}
                <option value={p}>{p}</option>
              {/each}
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            {@render lbl('Theme', 'theme')}
            <select class="select select-sm select-bordered w-full" bind:value={theme}>
              <option value="light">light</option>
              <option value="dark">dark</option>
              <option value="system">system</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            {@render lbl('Visible toasts', 'visible-toasts')}
            <input
              type="number"
              class="input input-sm input-bordered w-full"
              min="1"
              max="9"
              bind:value={visibleToasts}
            />
          </label>

          <label class="flex flex-col gap-1.5">
            {@render lbl('Duration', 'duration', 'ms')}
            <input
              type="number"
              class="input input-sm input-bordered w-full"
              min="0"
              step="500"
              bind:value={duration}
            />
          </label>
        </div>

        <div class="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          <label class="label cursor-pointer justify-start gap-2">
            <input type="checkbox" class="checkbox checkbox-sm" bind:checked={richColors} />
            {@render lbl('Rich colors', 'rich-colors')}
          </label>
          <label class="label cursor-pointer justify-start gap-2">
            <input type="checkbox" class="checkbox checkbox-sm" bind:checked={closeButton} />
            {@render lbl('Close button', 'close-button')}
          </label>
          <label class="label cursor-pointer justify-start gap-2">
            <input type="checkbox" class="checkbox checkbox-sm" bind:checked={expand} />
            {@render lbl('Expand', 'expand')}
          </label>
        </div>

        <details class="collapse collapse-arrow mt-4 border border-base-300">
          <summary class="collapse-title text-sm font-medium">Advanced attributes</summary>
          <div class="collapse-content grid gap-4 sm:grid-cols-2">
            <label class="label cursor-pointer justify-start gap-2 sm:col-span-2">
              <input type="checkbox" class="checkbox checkbox-sm" bind:checked={invert} />
              {@render lbl('Invert', 'invert')}
            </label>

            <label class="flex flex-col gap-1.5">
              {@render lbl('Direction', 'dir')}
              <select class="select select-sm select-bordered w-full" bind:value={dir}>
                <option value="auto">auto</option>
                <option value="ltr">ltr</option>
                <option value="rtl">rtl</option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              {@render lbl('Gap', 'gap', 'px')}
              <input type="number" class="input input-sm input-bordered w-full" min="0" bind:value={gap} />
            </label>

            <label class="flex flex-col gap-1.5">
              {@render lbl('Offset', 'offset')}
              <input type="text" class="input input-sm input-bordered w-full" bind:value={offset} />
            </label>

            <label class="flex flex-col gap-1.5">
              {@render lbl('Mobile offset', 'mobile-offset')}
              <input type="text" class="input input-sm input-bordered w-full" bind:value={mobileOffset} />
            </label>

            <label class="flex flex-col gap-1.5">
              {@render lbl('Hotkey', 'hotkey')}
              <input type="text" class="input input-sm input-bordered w-full" bind:value={hotkey} />
            </label>

            <label class="flex flex-col gap-1.5">
              {@render lbl('Container label', 'container-aria-label')}
              <input
                type="text"
                class="input input-sm input-bordered w-full"
                bind:value={containerAriaLabel}
              />
            </label>
          </div>
        </details>
      </section>

      <!-- Toast options -->
      <section class="reveal rounded-box border border-base-300 p-5" style="--d:120ms">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-semibold">Toast</h2>
            <p class="text-sm text-base-content/55">Options for a single <code>toast()</code> call.</p>
          </div>
          <button class="btn btn-ghost btn-xs" onclick={resetToast}>Reset</button>
        </div>

        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            {@render lbl('Type')}
            <select class="select select-sm select-bordered w-full" bind:value={toastType}>
              <option value="default">default</option>
              <option value="success">success</option>
              <option value="error">error</option>
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="loading">loading</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            {@render lbl('Title')}
            <input type="text" class="input input-sm input-bordered w-full" bind:value={toastTitle} />
          </label>

          <label class="flex flex-col gap-1.5 sm:col-span-2">
            {@render lbl('Description', 'description')}
            <input
              type="text"
              class="input input-sm input-bordered w-full"
              bind:value={toastDescription}
              placeholder="(empty = none)"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            {@render lbl('Action', 'action.label')}
            <input
              type="text"
              class="input input-sm input-bordered w-full"
              bind:value={actionLabel}
              placeholder="(empty = none)"
            />
          </label>

          <label class="flex flex-col gap-1.5">
            {@render lbl('Cancel', 'cancel.label')}
            <input
              type="text"
              class="input input-sm input-bordered w-full"
              bind:value={cancelLabel}
              placeholder="(empty = none)"
            />
          </label>
        </div>

        <!-- Per-toast overrides of toaster defaults -->
        <div class="mt-5 border-t border-base-300 pt-4">
          <h3 class="text-sm font-semibold text-base-content/70">Overrides</h3>
          <div class="mt-3 grid items-end gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1.5">
              {@render lbl('Close button', 'closeButton')}
              <select class="select select-sm select-bordered w-full" bind:value={toastCloseButton}>
                <option value="inherit">inherit</option>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>

            <label class="flex flex-col gap-1.5">
              {@render lbl('Rich colors', 'richColors')}
              <select class="select select-sm select-bordered w-full" bind:value={toastRichColors}>
                <option value="inherit">inherit</option>
                <option value="on">on</option>
                <option value="off">off</option>
              </select>
            </label>

            <div class="flex flex-col gap-1.5">
              <label class="label cursor-pointer justify-start gap-2 p-0">
                <input type="checkbox" class="checkbox checkbox-sm" bind:checked={overrideDuration} />
                {@render lbl('Override duration', 'duration')}
              </label>
              <input
                type="number"
                class="input input-sm input-bordered w-full"
                min="0"
                step="500"
                disabled={!overrideDuration}
                bind:value={toastDuration}
              />
            </div>

            <label class="label cursor-pointer justify-start gap-2 self-end">
              <input type="checkbox" class="checkbox checkbox-sm" bind:checked={toastDismissible} />
              {@render lbl('Dismissible', 'dismissible')}
            </label>
          </div>
        </div>
      </section>
    </div>

    <!-- Sticky output rail: fire · code -->
    <aside class="reveal lg:sticky lg:top-6 flex flex-col gap-4" style="--d:180ms">
      <!-- Primary action + variant triggers -->
      <div class="rounded-box border border-base-300 p-5">
        <button class="btn btn-primary btn-block" onclick={fireToast}>Fire toast</button>
        <p class="mt-3 text-xs font-medium text-base-content/55">Other variants</p>
        <div class="mt-2 grid grid-cols-2 gap-2">
          <button class="btn btn-sm" onclick={() => firePromise(true)}>promise (ok)</button>
          <button class="btn btn-sm" onclick={() => firePromise(false)}>promise (fail)</button>
          <button class="btn btn-sm" onclick={fireCustom}>custom</button>
          <button class="btn btn-sm btn-ghost" onclick={() => toast?.dismiss()}>dismiss all</button>
        </div>
      </div>

      <!-- Generated code: markup + call -->
      <div class="rounded-box border border-base-300 p-5">
        <h2 class="font-semibold">Code</h2>

        <p class="mt-3 mb-1.5 text-xs font-medium text-base-content/55">Markup</p>
        <div class="relative">
          {@html markupHtml}
          <div class="absolute right-2 top-2"><CopyButton text={markupSnippet} /></div>
        </div>

        <p class="mt-4 mb-1.5 text-xs font-medium text-base-content/55">Call</p>
        <div class="relative">
          {@html callHtml}
          <div class="absolute right-2 top-2"><CopyButton text={callSnippet} /></div>
        </div>
      </div>
    </aside>
  </div>
</section>

<sonner-toaster
  {position}
  {theme}
  {dir}
  gap={String(gap)}
  duration={String(duration)}
  visible-toasts={String(visibleToasts)}
  offset={offset}
  mobile-offset={mobileOffset}
  hotkey={hotkey}
  container-aria-label={containerAriaLabel}
  rich-colors={richColors || undefined}
  close-button={closeButton || undefined}
  expand={expand || undefined}
  invert={invert || undefined}
></sonner-toaster>

<style>
  /* One-shot staggered reveal on load; respects reduced-motion. */
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
      animation-delay: var(--d, 0ms);
    }
    @keyframes reveal {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
  }
</style>
