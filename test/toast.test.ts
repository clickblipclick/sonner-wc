/**
 * Unit tests for the toast() helper + registry + state transitions.
 * Runs in Bun's test runner using happy-dom (or jsdom-style globals).
 *
 * We don't test pixel-perfect rendering, layout, or interaction here —
 * those live in (future) Playwright tests. We test the public API contract.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';
GlobalRegistrator.register();

// happy-dom doesn't ship adoptedStyleSheets/CSSStyleSheet replaceSync as a perfect spec match;
// shim what we need before importing our module.
if (typeof globalThis.CSSStyleSheet === 'undefined') {
  // @ts-expect-error test shim
  globalThis.CSSStyleSheet = class {
    replaceSync() {}
  };
}

const { toast } = await import('../src/index');
const { TIME_BEFORE_UNMOUNT } = await import('../src/constants');

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';

function flush(ms = 0): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  toast.dismiss();
});

describe('toast() helper', () => {
  test('creates a sonner-toast and auto-creates a sonner-toaster', async () => {
    const el = toast('Hello');
    expect(el.tagName.toLowerCase()).toBe('sonner-toast');
    expect(document.querySelector('sonner-toaster')).not.toBeNull();
    expect(el.getAttribute('type')).toBe('default');
  });

  test('error and warning toasts use role=alert / aria-live=assertive', () => {
    const e = toast.error('uh oh');
    expect(e.getAttribute('role')).toBe('alert');
    expect(e.getAttribute('aria-live')).toBe('assertive');
    const w = toast.warning('careful');
    expect(w.getAttribute('role')).toBe('alert');
    const s = toast.success('done');
    expect(s.getAttribute('role')).toBe('status');
    expect(s.getAttribute('aria-live')).toBe('polite');
  });

  test('variants set the correct type attribute', () => {
    expect(toast.success('a').getAttribute('type')).toBe('success');
    expect(toast.error('b').getAttribute('type')).toBe('error');
    expect(toast.info('c').getAttribute('type')).toBe('info');
    expect(toast.warning('d').getAttribute('type')).toBe('warning');
    expect(toast.loading('e').getAttribute('type')).toBe('loading');
  });

  test('id allows updating an existing toast in place', () => {
    const a = toast.loading('Working', { id: 'job-1' });
    const b = toast.success('Done', { id: 'job-1' });
    expect(a).toBe(b);
    expect(a.getAttribute('type')).toBe('success');
  });

  test('description renders as a slotted child', () => {
    const el = toast('Hi', { description: 'Details' });
    const descChild = Array.from(el.children).find((c) => c.getAttribute('slot') === 'description');
    expect(descChild?.textContent).toBe('Details');
  });

  test('action button triggers onClick and dismisses by default', async () => {
    let clicked = false;
    const el = toast('Hi', { action: { label: 'OK', onClick: () => (clicked = true) } });
    const btn = Array.from(el.children).find(
      (c) => c.getAttribute('slot') === 'action',
    ) as HTMLButtonElement;
    expect(btn).toBeDefined();
    btn.click();
    expect(clicked).toBe(true);
    await flush(TIME_BEFORE_UNMOUNT + 20);
    expect(el.isConnected).toBe(false);
  });

  test('dismiss(id) dismisses a specific toast', async () => {
    const a = toast('A', { id: 'a' });
    const b = toast('B', { id: 'b' });
    toast.dismiss('a');
    await flush(TIME_BEFORE_UNMOUNT + 20);
    expect(a.isConnected).toBe(false);
    expect(b.isConnected).toBe(true);
  });

  test('dismiss() with no id dismisses all toasts', async () => {
    const a = toast('A');
    const b = toast('B');
    toast.dismiss();
    await flush(TIME_BEFORE_UNMOUNT + 20);
    expect(a.isConnected).toBe(false);
    expect(b.isConnected).toBe(false);
  });

  test('custom toast appends the user-built element', () => {
    const el = toast.custom((id) => {
      const d = document.createElement('div');
      d.id = `custom-${id}`;
      d.textContent = 'Hello';
      return d;
    });
    expect(el.querySelector('div[id^="custom-"]')).not.toBeNull();
    expect(el.getAttribute('data-styled')).toBe('false');
  });
});

describe('toast.promise', () => {
  test('transitions loading → success', async () => {
    const el = toast.promise(Promise.resolve({ x: 1 }), {
      loading: 'Loading',
      success: (d) => `Got ${d.x}`,
      error: 'Err',
    });
    expect(el.getAttribute('type')).toBe('loading');
    await flush(20);
    expect(el.getAttribute('type')).toBe('success');
    const title = Array.from(el.children).find((c) => c.getAttribute('slot') === 'title');
    expect(title?.textContent).toBe('Got 1');
  });

  test('transitions loading → error on rejection', async () => {
    const err = new Error('boom');
    const el = toast.promise(Promise.reject(err), {
      loading: 'Loading',
      success: 'ok',
      error: (e) => `${(e as Error).message}`,
    });
    expect(el.getAttribute('type')).toBe('loading');
    await flush(20);
    expect(el.getAttribute('type')).toBe('error');
  });

  test('clears the Infinity loading duration when transitioning to success', async () => {
    const el = toast.promise(Promise.resolve(1), { loading: 'L', success: 'S', error: 'E' });
    await flush(20);
    // After transition, the inherited Infinity duration must be discarded so the success
    // toast can pick up the default TOAST_LIFETIME and auto-dismiss.
    expect(el.hasAttribute('duration')).toBe(false);
  });

  test('unwrap() resolves to the promise value', async () => {
    const r = toast.promise(Promise.resolve(42), {
      loading: 'L',
      success: 'S',
      error: 'E',
    });
    const value = await r.unwrap();
    expect(value).toBe(42);
  });
});

describe('shadow frame isolation', () => {
  test('toast shadow wraps internals in [data-frame]', async () => {
    const el = toast('hello');
    await flush();
    const frame = el.shadowRoot!.querySelector('[data-frame]');
    expect(frame).not.toBeNull();
    expect(frame!.getAttribute('part')).toBe('frame');

    // The frame wraps the previous template children, not just an empty div.
    expect(frame!.querySelector('[data-icon]')).not.toBeNull();
    expect(frame!.querySelector('[data-content]')).not.toBeNull();
    expect(frame!.querySelector('[data-close-button]')).not.toBeNull();
  });

  test('toaster shadow wraps the slot in [data-frame]', async () => {
    toast('mount-the-toaster');
    await flush();
    const toaster = document.querySelector('sonner-toaster')!;
    const frame = toaster.shadowRoot!.querySelector('[data-frame]');
    expect(frame).not.toBeNull();
    expect(frame!.getAttribute('part')).toBe('frame');
    // The toaster's slot lives inside the frame.
    expect(frame!.querySelector('slot')).not.toBeNull();
  });
});
