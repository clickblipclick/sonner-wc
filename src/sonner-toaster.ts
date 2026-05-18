import { DEFAULT_HOTKEY, GAP, TOAST_WIDTH, VISIBLE_TOASTS_AMOUNT } from './constants.js';
import { registerToaster, unregisterToaster } from './registry.js';
import { getToasterSheet } from './styles.js';
import { SonnerToast } from './sonner-toast.js';
import type {
  Position,
  SonnerToastElement,
  SonnerToasterElement,
  Theme,
  ToasterOptions,
} from './types.js';

const HTMLElementCtor: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement);

function parseOffsetValue(v: string | number | undefined, fallback: string): string {
  if (v == null) return fallback;
  if (typeof v === 'number') return `${v}px`;
  return v;
}

function applyOffsetVars(
  host: HTMLElement,
  opts: ToasterOptions['offset'],
  prefix: string,
  fallback: string,
) {
  const sides = ['top', 'right', 'bottom', 'left'] as const;
  if (opts == null || typeof opts === 'string' || typeof opts === 'number') {
    const v = parseOffsetValue(opts, fallback);
    for (const side of sides) host.style.setProperty(`${prefix}-${side}`, v);
  } else {
    for (const side of sides) {
      host.style.setProperty(`${prefix}-${side}`, parseOffsetValue(opts[side], fallback));
    }
  }
}

export class SonnerToaster extends HTMLElementCtor implements SonnerToasterElement {
  static get observedAttributes() {
    return [
      'position',
      'theme',
      'rich-colors',
      'expand',
      'duration',
      'gap',
      'visible-toasts',
      'close-button',
      'invert',
      'dir',
      'offset',
      'mobile-offset',
      'hotkey',
      'container-aria-label',
    ];
  }

  #shadow: ShadowRoot;
  #childObserver: MutationObserver;
  #resizeObserver: ResizeObserver;
  #toasts: SonnerToast[] = [];
  /** Last measured height per toast. We keep the prior value while a toast is mid-removal
   *  (data-removed='true') so its shrinking does not corrupt the offsets of survivors. */
  #heights = new Map<SonnerToast, number>();
  /** True during the synchronous measurement window inside #reflow so the ResizeObserver
   *  doesn't recursively re-fire while we're toggling style.height to measure naturals. */
  #measuring = false;
  #expanded = false;
  #interacting = false;
  #themeMql: MediaQueryList | null = null;
  #themeMqlHandler: ((e: MediaQueryListEvent | MediaQueryList) => void) | null = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#shadow.adoptedStyleSheets = [getToasterSheet()];
    this.#shadow.innerHTML = '<div data-frame part="frame"><slot></slot></div>';

    this.#childObserver = new MutationObserver((records) => {
      let changed = false;
      for (const r of records) {
        for (const node of Array.from(r.addedNodes)) {
          if (node instanceof SonnerToast) {
            this.#toasts.unshift(node);
            this.#resizeObserver.observe(node);
            this.#decorateToast(node);
            changed = true;
          }
        }
        for (const node of Array.from(r.removedNodes)) {
          if (node instanceof SonnerToast) {
            this.#toasts = this.#toasts.filter((t) => t !== node);
            this.#heights.delete(node);
            this.#resizeObserver.unobserve(node);
            changed = true;
          }
        }
      }
      if (changed) this.#reflow({ remeasure: true });
    });

    // ResizeObserver fires every frame while a height transition is running (because the
    // rendered size IS changing). We must NOT re-measure on those events — doing so would
    // temporarily set style.height='auto' on a mid-transition toast and cancel the
    // animation. RO here only re-applies layout from the cached heights.
    this.#resizeObserver = new ResizeObserver(() => this.#reflow({ remeasure: false }));

    this.addEventListener('mouseenter', this.#onPointerEnter);
    this.addEventListener('mouseleave', this.#onPointerLeave);
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
    this.addEventListener('sonner-toast-dismissed', () => this.#reflow({ remeasure: false }));
    // Content actually changed — re-measure the toast that updated.
    this.addEventListener('sonner-toast-updated', () => this.#reflow({ remeasure: true }));
    this.addEventListener('sonner-toast-mounted', () => this.#reflow({ remeasure: true }));
  }

  connectedCallback() {
    if (!this.hasAttribute('tabindex')) this.tabIndex = -1;
    if (!this.hasAttribute('role')) this.setAttribute('role', 'region');
    if (!this.hasAttribute('aria-label'))
      this.setAttribute('aria-label', this.getAttribute('container-aria-label') ?? 'Notifications');
    this.setAttribute('data-sonner-toaster', '');
    this.#applyPosition();
    this.#applyTheme();
    this.#applyDir();
    this.#applyGap();
    this.#applyWidth();
    this.#applyOffsets();

    this.#childObserver.observe(this, { childList: true });
    for (const child of Array.from(this.children)) {
      if (child instanceof SonnerToast) {
        this.#toasts.unshift(child);
        this.#resizeObserver.observe(child);
        this.#decorateToast(child);
      }
    }
    document.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('resize', this.#onWindowResize);
    registerToaster(this);
    this.#reflow({ remeasure: true });
  }

  disconnectedCallback() {
    this.#childObserver.disconnect();
    this.#resizeObserver.disconnect();
    document.removeEventListener('keydown', this.#onKeyDown);
    window.removeEventListener('resize', this.#onWindowResize);
    if (this.#themeMql && this.#themeMqlHandler) {
      this.#themeMql.removeEventListener('change', this.#themeMqlHandler);
    }
    unregisterToaster(this);
  }

  attributeChangedCallback(name: string, _old: string | null, _val: string | null) {
    if (!this.isConnected) return;
    switch (name) {
      case 'position':
        this.#applyPosition();
        this.#applyToastPositions();
        this.#reflow();
        break;
      case 'theme':
        this.#applyTheme();
        break;
      case 'dir':
        this.#applyDir();
        break;
      case 'gap':
        this.#applyGap();
        this.#reflow();
        break;
      case 'visible-toasts':
        this.#reflow();
        break;
      case 'expand':
        this.#expanded = this.hasAttribute('expand');
        for (const t of this.#toasts) t.setPaused(this.#expanded || this.#interacting);
        this.#reflow();
        break;
      case 'close-button':
      case 'rich-colors':
      case 'invert':
        this.#propagateBoolean(name);
        break;
      case 'offset':
      case 'mobile-offset':
        this.#applyOffsets();
        break;
      case 'container-aria-label':
        this.setAttribute('aria-label', this.getAttribute('container-aria-label') ?? 'Notifications');
        break;
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  addToast(el: SonnerToastElement): SonnerToastElement {
    this.appendChild(el);
    return el;
  }

  dismissAll(): void {
    // Iterate live children so toasts appended this tick (before the MutationObserver
    // fires) are still covered.
    for (const child of Array.from(this.children)) {
      if (child instanceof SonnerToast) child.dismiss();
    }
  }

  // ─── Configuration application ───────────────────────────────────────────

  #getPosition(): Position {
    return (this.getAttribute('position') as Position) || 'bottom-right';
  }

  #applyPosition() {
    const [y, x] = this.#getPosition().split('-');
    if (y) this.setAttribute('data-y-position', y);
    if (x) this.setAttribute('data-x-position', x);
  }

  #applyTheme() {
    if (this.#themeMql && this.#themeMqlHandler) {
      this.#themeMql.removeEventListener('change', this.#themeMqlHandler);
      this.#themeMql = null;
      this.#themeMqlHandler = null;
    }
    const theme = (this.getAttribute('theme') as Theme) || 'light';
    if (theme === 'system') {
      this.#themeMql = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = (mql: MediaQueryList | MediaQueryListEvent) => {
        this.setAttribute('data-sonner-theme', mql.matches ? 'dark' : 'light');
      };
      this.#themeMqlHandler = apply;
      this.#themeMql.addEventListener('change', apply);
      apply(this.#themeMql);
    } else {
      this.setAttribute('data-sonner-theme', theme);
    }
  }

  #applyDir() {
    const dir = this.getAttribute('dir');
    if (dir === 'auto' || !dir) {
      const computed = window.getComputedStyle(document.documentElement).direction || 'ltr';
      this.setAttribute('dir', computed);
    }
  }

  #applyGap() {
    const raw = this.getAttribute('gap');
    const gap = raw ? Number(raw) : GAP;
    this.style.setProperty('--gap', `${Number.isFinite(gap) ? gap : GAP}px`);
  }

  #applyWidth() {
    this.style.setProperty('--width', `${TOAST_WIDTH}px`);
  }

  #applyOffsets() {
    const off = this.getAttribute('offset');
    const mobileOff = this.getAttribute('mobile-offset');
    applyOffsetVars(this, off ?? undefined, '--offset', '24px');
    applyOffsetVars(this, mobileOff ?? undefined, '--mobile-offset', '16px');
  }

  #applyToastPositions() {
    for (const t of this.#toasts) {
      if (!t.hasAttribute('position')) {
        const [y, x] = this.#getPosition().split('-');
        if (y) t.setAttribute('data-y-position', y);
        if (x) t.setAttribute('data-x-position', x);
      }
    }
  }

  /** Mirror a toaster-level boolean attribute (close-button, rich-colors, invert) onto
   *  every existing toast that hasn't set the same attribute itself. Per-toast overrides
   *  still win. */
  #propagateBoolean(attr: 'close-button' | 'rich-colors' | 'invert') {
    const on = this.hasAttribute(attr);
    for (const t of this.#toasts) {
      // Skip if the toast explicitly opted out with `attr="false"` — that's a per-toast override.
      if (t.getAttribute(attr) === 'false') continue;
      if (on) t.setAttribute(attr, '');
      else t.removeAttribute(attr);
    }
  }

  #decorateToast(toast: SonnerToast) {
    if (!toast.hasAttribute('position')) {
      const [y, x] = this.#getPosition().split('-');
      if (y) toast.setAttribute('data-y-position', y);
      if (x) toast.setAttribute('data-x-position', x);
    }
    if (!toast.hasAttribute('duration')) {
      const inherit = this.getAttribute('duration');
      if (inherit) toast.setAttribute('duration', inherit);
    }
    if (!toast.hasAttribute('close-button') && this.hasAttribute('close-button')) {
      toast.setAttribute('close-button', '');
    }
    if (!toast.hasAttribute('rich-colors') && this.hasAttribute('rich-colors')) {
      toast.setAttribute('rich-colors', '');
    }
    if (!toast.hasAttribute('invert') && this.hasAttribute('invert')) {
      toast.setAttribute('invert', '');
    }
  }

  // ─── Stacking math ───────────────────────────────────────────────────────

  #reflow(opts: { remeasure: boolean } = { remeasure: false }) {
    const visibleAmount = Number(this.getAttribute('visible-toasts') ?? VISIBLE_TOASTS_AMOUNT);

    // Only measure when explicitly requested (toast added / updated / mounted / window
    // resized). Measuring on every reflow corrupts running height transitions, because
    // the temp `style.height='auto'` cancels them.
    if (opts.remeasure) {
      this.#measuring = true;
      for (const t of this.#toasts) {
        if (t.getAttribute('data-removed') === 'true') continue;
        const prior = t.style.height;
        t.style.height = 'auto';
        this.#heights.set(t, t.getBoundingClientRect().height);
        t.style.height = prior;
      }
      this.#measuring = false;
    }

    const active = this.#toasts.filter((t) => t.getAttribute('data-removed') !== 'true');
    const frontHeight = active.length > 0 ? (this.#heights.get(active[0]!) ?? 0) : 0;
    const gap = this.#gapPx();
    const expanded = this.#expanded || this.#interacting;
    let cumulative = 0;

    // Single inherited value for all toasts — when this changes, every toast's
    // height: var(--front-toast-height) re-resolves and transitions in lockstep.
    this.style.setProperty('--front-toast-height', `${frontHeight}px`);

    for (let i = 0; i < active.length; i++) {
      const toast = active[i]!;
      const h = this.#heights.get(toast) ?? 0;
      const isFront = i === 0;
      const offset = i === 0 ? 0 : cumulative + i * gap;
      cumulative += h;

      toast.style.setProperty('--index', String(i));
      toast.style.setProperty('--toasts-before', String(i));
      toast.style.setProperty('--z-index', String(active.length - i));
      toast.style.setProperty('--offset', `${offset}px`);
      toast.style.setProperty('--initial-height', `${h}px`);
      // height itself is driven by CSS now (interpolate-size handles auto↔pixel).
      toast.setAttribute('data-index', String(i));
      toast.setAttribute('data-front', String(isFront));
      toast.setAttribute('data-visible', String(i + 1 <= visibleAmount));
      toast.setAttribute('data-expanded', String(expanded));
    }
  }

  #gapPx(): number {
    const raw = this.getAttribute('gap');
    const n = raw ? Number(raw) : GAP;
    return Number.isFinite(n) ? n : GAP;
  }

  // ─── Hover / expand / hotkey ─────────────────────────────────────────────

  #onPointerEnter = () => {
    this.#interacting = true;
    for (const t of this.#toasts) t.setPaused(true);
    this.#reflow();
  };

  #onPointerLeave = () => {
    this.#interacting = false;
    for (const t of this.#toasts) t.setPaused(false);
    this.#reflow();
  };

  #onFocusIn = () => {
    this.#interacting = true;
    for (const t of this.#toasts) t.setPaused(true);
    this.#reflow();
  };

  #onFocusOut = (e: FocusEvent) => {
    const next = e.relatedTarget as Node | null;
    if (next && this.contains(next)) return;
    this.#interacting = false;
    for (const t of this.#toasts) t.setPaused(false);
    this.#reflow();
  };

  #onWindowResize = () => this.#reflow({ remeasure: true });

  #onKeyDown = (event: KeyboardEvent) => {
    // Don't hijack the hotkey when the user is typing.
    const target = event.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) {
        return;
      }
    }
    const hotkey = this.#hotkey();
    const matches = hotkey.every((key) => {
      if (key === 'altKey' || key === 'ctrlKey' || key === 'shiftKey' || key === 'metaKey') {
        return event[key as 'altKey'];
      }
      return event.code === key;
    });
    if (matches) {
      this.#expanded = true;
      for (const t of this.#toasts) t.setPaused(true);
      this.focus();
      this.#reflow();
      return;
    }
    if (event.key === 'Escape' && this.#expanded && this.contains(document.activeElement)) {
      this.#expanded = false;
      for (const t of this.#toasts) t.setPaused(false);
      this.#reflow();
    }
  };

  #hotkey(): readonly string[] {
    const raw = this.getAttribute('hotkey');
    if (!raw) return DEFAULT_HOTKEY;
    return raw.split('+').map((s) => s.trim());
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('sonner-toaster')) {
  customElements.define('sonner-toaster', SonnerToaster);
}
