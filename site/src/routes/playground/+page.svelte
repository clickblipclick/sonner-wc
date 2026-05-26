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

  const snippet = $derived.by(() => {
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

  let snippetHtml = $state('');
  $effect(() => {
    const s = snippet;
    void highlight(s, 'html').then((h) => (snippetHtml = h));
  });

  onMount(async () => {
    const mod = await import('$lib/sonner-wc');
    toast = mod.toast;
  });

  // --- Toast (per-invocation) options ---
  type ToastType = 'default' | 'success' | 'error' | 'info' | 'warning' | 'loading';
  type Tri = 'inherit' | 'on' | 'off';

  const ALT_TOASTER_ID = 'playground-alt';

  let toastType: ToastType = $state('default');
  let toastTitle = $state('Event has been created');
  let toastDescription = $state('');
  let overrideDuration = $state(false);
  let toastDuration = $state(4000);
  let toastDismissible = $state(true);
  let toasterId = $state('');
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
    toasterId = '';
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
    if (toasterId) opts.toasterId = toasterId;
    if (toastCloseButton !== 'inherit') opts.closeButton = toastCloseButton === 'on';
    if (toastRichColors !== 'inherit') opts.richColors = toastRichColors === 'on';
    if (actionLabel)
      opts.action = { label: actionLabel, onClick: () => toast?.success('Action clicked.') };
    if (cancelLabel) opts.cancel = { label: cancelLabel, onClick: () => {} };
    const fn = toastType === 'default' ? toast : toast[toastType];
    fn(toastTitle, opts);
  }

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

<section class="mx-auto max-w-6xl px-4 py-8">
  <header class="mb-6">
    <h1 class="text-3xl font-semibold tracking-tight">Playground</h1>
    <p class="mt-2 text-base-content/70">
      Tweak every <code>&lt;sonner-toaster&gt;</code> attribute and fire toasts to see how
      they behave together. The snippet below reflects your current settings.
    </p>
  </header>

  <div class="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
    <!-- Controls -->
    <aside class="rounded-box border border-base-300 p-4">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Toaster</h2>
        <button class="btn btn-ghost btn-xs" onclick={reset}>Reset</button>
      </div>

      <div class="mt-3 grid gap-3">
        <label class="form-control">
          <span class="label-text mb-1">position</span>
          <select class="select select-sm select-bordered" bind:value={position}>
            {#each POSITIONS as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </label>

        <label class="form-control">
          <span class="label-text mb-1">theme</span>
          <select class="select select-sm select-bordered" bind:value={theme}>
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="system">system</option>
          </select>
        </label>

        <label class="form-control">
          <span class="label-text mb-1">visible-toasts</span>
          <input
            type="number"
            class="input input-sm input-bordered"
            min="1"
            max="9"
            bind:value={visibleToasts}
          />
        </label>

        <label class="form-control">
          <span class="label-text mb-1">duration (ms)</span>
          <input
            type="number"
            class="input input-sm input-bordered"
            min="0"
            step="500"
            bind:value={duration}
          />
        </label>

        <label class="label cursor-pointer justify-start gap-3">
          <input type="checkbox" class="checkbox checkbox-sm" bind:checked={richColors} />
          <span class="label-text">rich-colors</span>
        </label>

        <label class="label cursor-pointer justify-start gap-3">
          <input type="checkbox" class="checkbox checkbox-sm" bind:checked={closeButton} />
          <span class="label-text">close-button</span>
        </label>

        <label class="label cursor-pointer justify-start gap-3">
          <input type="checkbox" class="checkbox checkbox-sm" bind:checked={expand} />
          <span class="label-text">expand</span>
        </label>
      </div>

      <details class="collapse collapse-arrow mt-4 border border-base-300">
        <summary class="collapse-title text-sm font-medium">Advanced</summary>
        <div class="collapse-content grid gap-3">
          <label class="label cursor-pointer justify-start gap-3">
            <input type="checkbox" class="checkbox checkbox-sm" bind:checked={invert} />
            <span class="label-text">invert</span>
          </label>

          <label class="form-control">
            <span class="label-text mb-1">dir</span>
            <select class="select select-sm select-bordered" bind:value={dir}>
              <option value="auto">auto</option>
              <option value="ltr">ltr</option>
              <option value="rtl">rtl</option>
            </select>
          </label>

          <label class="form-control">
            <span class="label-text mb-1">gap (px)</span>
            <input
              type="number"
              class="input input-sm input-bordered"
              min="0"
              bind:value={gap}
            />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">offset</span>
            <input type="text" class="input input-sm input-bordered" bind:value={offset} />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">mobile-offset</span>
            <input
              type="text"
              class="input input-sm input-bordered"
              bind:value={mobileOffset}
            />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">hotkey</span>
            <input type="text" class="input input-sm input-bordered" bind:value={hotkey} />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">container-aria-label</span>
            <input
              type="text"
              class="input input-sm input-bordered"
              bind:value={containerAriaLabel}
            />
          </label>
        </div>
      </details>
    </aside>

    <!-- Toast options + triggers -->
    <div>
      <div class="rounded-box border border-base-300 p-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Toast</h2>
          <button class="btn btn-ghost btn-xs" onclick={resetToast}>Reset</button>
        </div>

        <div class="mt-3 grid gap-3 sm:grid-cols-2">
          <label class="form-control">
            <span class="label-text mb-1">type</span>
            <select class="select select-sm select-bordered" bind:value={toastType}>
              <option value="default">default</option>
              <option value="success">success</option>
              <option value="error">error</option>
              <option value="info">info</option>
              <option value="warning">warning</option>
              <option value="loading">loading</option>
            </select>
          </label>

          <label class="form-control">
            <span class="label-text mb-1">
              toasterId
              <button
                type="button"
                class="link link-primary text-xs ml-1"
                onclick={() => (toasterId = ALT_TOASTER_ID)}
              >
                try "{ALT_TOASTER_ID}"
              </button>
            </span>
            <input
              type="text"
              class="input input-sm input-bordered"
              bind:value={toasterId}
              placeholder="(empty = default toaster)"
            />
          </label>

          <label class="form-control sm:col-span-2">
            <span class="label-text mb-1">title</span>
            <input
              type="text"
              class="input input-sm input-bordered"
              bind:value={toastTitle}
            />
          </label>

          <label class="form-control sm:col-span-2">
            <span class="label-text mb-1">description</span>
            <input
              type="text"
              class="input input-sm input-bordered"
              bind:value={toastDescription}
              placeholder="(empty = none)"
            />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">action label</span>
            <input
              type="text"
              class="input input-sm input-bordered"
              bind:value={actionLabel}
              placeholder="(empty = none)"
            />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">cancel label</span>
            <input
              type="text"
              class="input input-sm input-bordered"
              bind:value={cancelLabel}
              placeholder="(empty = none)"
            />
          </label>

          <label class="form-control">
            <span class="label-text mb-1">close-button (override)</span>
            <select class="select select-sm select-bordered" bind:value={toastCloseButton}>
              <option value="inherit">inherit</option>
              <option value="on">on</option>
              <option value="off">off</option>
            </select>
          </label>

          <label class="form-control">
            <span class="label-text mb-1">rich-colors (override)</span>
            <select class="select select-sm select-bordered" bind:value={toastRichColors}>
              <option value="inherit">inherit</option>
              <option value="on">on</option>
              <option value="off">off</option>
            </select>
          </label>

          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                class="checkbox checkbox-sm"
                bind:checked={overrideDuration}
              />
              <span class="label-text">override duration</span>
            </label>
            <input
              type="number"
              class="input input-sm input-bordered mt-1"
              min="0"
              step="500"
              disabled={!overrideDuration}
              bind:value={toastDuration}
            />
          </div>

          <label class="label cursor-pointer justify-start gap-3 self-end">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              bind:checked={toastDismissible}
            />
            <span class="label-text">dismissible</span>
          </label>
        </div>

        <button class="btn btn-primary btn-sm mt-4" onclick={fireToast}>Fire toast</button>
      </div>

      <div class="rounded-box mt-6 border border-base-300 p-4">
        <h2 class="font-semibold">Special triggers</h2>
        <p class="text-sm text-base-content/60 mt-1">
          Variants the option form can't express.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button class="btn btn-sm" onclick={() => firePromise(true)}>promise (ok)</button>
          <button class="btn btn-sm" onclick={() => firePromise(false)}>promise (fail)</button>
          <button class="btn btn-sm" onclick={fireCustom}>custom</button>
          <button class="btn btn-sm btn-ghost" onclick={() => toast?.dismiss()}>
            dismiss all
          </button>
        </div>
      </div>

      <div class="mt-6">
        <h2 class="mb-2 font-semibold">Snippet</h2>
        <div class="relative">
          {@html snippetHtml}
          <div class="absolute right-2 top-2"><CopyButton text={snippet} /></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Secondary toaster pinned to top-left, used when `toasterId` matches its id.
     Must be rendered BEFORE the primary toaster: toast() falls back to the
     most-recently-connected toaster, so the primary needs to connect last. -->
<sonner-toaster id={ALT_TOASTER_ID} position="top-left" {theme}></sonner-toaster>

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
