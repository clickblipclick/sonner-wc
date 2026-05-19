import {
  TOAST_LIFETIME,
  TIME_BEFORE_UNMOUNT,
  SWIPE_THRESHOLD,
  SWIPE_VELOCITY_THRESHOLD,
} from './constants.js';
import { CLOSE_ICON, getTypeIcon } from './icons.js';
import { registerToast, unregisterToast } from './registry.js';
import { HTMLElementCtor } from './ssr.js';
import { getToastSheet } from './styles.js';
import type {
  SonnerToastElement,
  SonnerToasterElement,
  SwipeDirection,
  ToastAction,
  ToastContent,
  ToastOptions,
  ToastType,
} from './types.js';

type PauseReason = 'hover-self' | 'focus-self' | 'doc-hidden' | 'toaster';

function isUrgentType(type: ToastType): boolean {
  return type === 'error' || type === 'warning';
}

/** Remove any light-DOM children currently assigned to `slotName`. */
function clearSlot(host: HTMLElement, slotName: string): void {
  for (const child of Array.from(host.children)) {
    if (child.getAttribute('slot') === slotName) host.removeChild(child);
  }
}

/** Parse an HTML string and tag its first element with `slot=slotName`. Returns
 *  `null` if the string didn't produce an element. */
function slotElementFromHTML(html: string, slotName: string): Element | null {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const el = tpl.content.firstElementChild;
  if (el) el.setAttribute('slot', slotName);
  return el;
}

function setContent(host: HTMLElement, slotName: string, value: ToastContent | undefined): void {
  clearSlot(host, slotName);
  if (value == null || value === '') return;
  const resolved = typeof value === 'function' ? value() : value;
  if (resolved instanceof Node) {
    if (resolved instanceof Element) resolved.setAttribute('slot', slotName);
    host.appendChild(resolved);
  } else {
    const span = document.createElement('span');
    span.setAttribute('slot', slotName);
    span.textContent = String(resolved);
    host.appendChild(span);
  }
}

function setButtonSlot(
  host: HTMLElement,
  slotName: 'action' | 'cancel',
  value: ToastAction | HTMLElement | undefined,
  defaultCloseHandler: () => void,
): void {
  clearSlot(host, slotName);
  if (!value) return;
  if (value instanceof HTMLElement) {
    value.setAttribute('slot', slotName);
    host.appendChild(value);
    return;
  }
  const btn = document.createElement('button');
  btn.setAttribute('slot', slotName);
  btn.setAttribute('type', 'button');
  if (slotName === 'cancel') btn.setAttribute('data-cancel', '');
  else btn.setAttribute('data-action', '');
  btn.textContent = value.label;
  btn.addEventListener('click', (e) => {
    value.onClick?.(e as MouseEvent);
    if ((e as MouseEvent).defaultPrevented && slotName === 'action') return;
    defaultCloseHandler();
  });
  host.appendChild(btn);
}

const SPINNER_BARS_HTML = Array.from(
  { length: 12 },
  () => '<div class="sonner-loading-bar"></div>',
).join('');

const SHADOW_TEMPLATE = `
  <div data-frame part="frame">
    <button type="button" data-close-button part="close-button" hidden aria-label="Close toast"></button>
    <div data-icon part="icon">
      <slot name="icon"></slot>
      <div class="sonner-loading-wrapper" aria-hidden="true">
        <div class="sonner-spinner">${SPINNER_BARS_HTML}</div>
      </div>
    </div>
    <div data-content part="content">
      <div data-title part="title"><slot name="title"></slot></div>
      <div data-description part="description"><slot name="description"></slot></div>
    </div>
    <slot name="cancel"></slot>
    <slot name="action"></slot>
    <slot part="custom"></slot>
  </div>
`;

export class SonnerToast extends HTMLElementCtor implements SonnerToastElement {
  static get observedAttributes() {
    return ['type', 'duration', 'dismissible', 'position', 'close-button', 'rich-colors', 'invert'];
  }

  toastId: string | number = 0;

  #shadow: ShadowRoot;
  #closeBtn!: HTMLButtonElement;
  #iconWrap!: HTMLDivElement;
  #titleWrap!: HTMLDivElement;
  #descWrap!: HTMLDivElement;

  #duration: number | null = null;
  #remainingTime = TOAST_LIFETIME;
  #timeoutId: ReturnType<typeof setTimeout> | null = null;
  #timerStartedAt = 0;
  #pauseReasons = new Set<PauseReason>();

  #pointerStart: { x: number; y: number } | null = null;
  #dragStartTime = 0;
  #swipeDirection: 'x' | 'y' | null = null;
  #swipeDirections: SwipeDirection[] | null = null;

  #mounted = false;
  #removed = false;
  #pendingRemoval = false;

  #onDismiss: ToastOptions['onDismiss'];
  #onAutoClose: ToastOptions['onAutoClose'];
  #closeButtonAriaLabel: string | null = null;
  /** Element that had focus immediately before focus first entered this toast.
   *  Used to restore focus when the toast is dismissed while focused. */
  #prevFocus: Element | null = null;

  constructor() {
    super();
    this.#shadow = this.attachShadow({ mode: 'open' });
    this.#shadow.adoptedStyleSheets = [getToastSheet()];
    const tpl = document.createElement('template');
    tpl.innerHTML = SHADOW_TEMPLATE;
    this.#shadow.appendChild(tpl.content.cloneNode(true));
    this.#closeBtn = this.#shadow.querySelector('[data-close-button]') as HTMLButtonElement;
    this.#iconWrap = this.#shadow.querySelector('[data-icon]') as HTMLDivElement;
    this.#titleWrap = this.#shadow.querySelector('[data-title]') as HTMLDivElement;
    this.#descWrap = this.#shadow.querySelector('[data-description]') as HTMLDivElement;
    this.#closeBtn.innerHTML = CLOSE_ICON;
    this.#closeBtn.addEventListener('click', () => this.dismiss());

    // Reflect slot occupancy as host attributes so CSS can collapse empty wrappers.
    // (Browser support for `:host(:has(...))` is uneven; this is the reliable form.)
    const iconSlot = this.#shadow.querySelector('slot[name="icon"]') as HTMLSlotElement;
    const descSlot = this.#shadow.querySelector('slot[name="description"]') as HTMLSlotElement;
    iconSlot.addEventListener('slotchange', () => this.#reflectSlot('icon', iconSlot));
    descSlot.addEventListener('slotchange', () => this.#reflectSlot('description', descSlot));

    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('pointermove', this.#onPointerMove);
    this.addEventListener('pointerup', this.#onPointerUp);
    this.addEventListener('pointercancel', this.#onPointerUp);
    this.addEventListener('mouseenter', () => this.#pauseFor('hover-self'));
    this.addEventListener('mouseleave', () => this.#resumeFrom('hover-self'));
    this.addEventListener('focusin', (e: FocusEvent) => {
      this.#pauseFor('focus-self');
      // Capture the externally-focused element only once, on first entry.
      if (this.#prevFocus) return;
      const from = e.relatedTarget as Element | null;
      if (from && !this.contains(from)) this.#prevFocus = from;
    });
    this.addEventListener('focusout', () => this.#resumeFrom('focus-self'));
    this.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.#isDismissible()) {
        e.stopPropagation();
        this.dismiss();
      }
    });
  }

  connectedCallback() {
    if (!this.toastId) this.toastId = this.getAttribute('id') || 0;
    if (!this.hasAttribute('tabindex')) this.tabIndex = 0;
    this.#applyType(); // sets role/aria-live based on type (error/warning → alert/assertive)
    this.#applyDismissible();
    this.#applyPosition();
    this.#applyRichColors();
    this.#applyInvert();
    this.#applyCloseButton();
    this.setAttribute('data-sonner-toast', '');
    // aria-atomic ensures the whole toast re-announces when its contents
    // change (e.g. promise loading → success), instead of only the diff.
    if (!this.hasAttribute('aria-atomic')) this.setAttribute('aria-atomic', 'true');
    this.setAttribute('data-mounted', 'false');
    this.setAttribute('data-removed', 'false');
    this.setAttribute('data-swiping', 'false');
    this.setAttribute('data-swiped', 'false');
    this.setAttribute('data-swipe-out', 'false');
    if (!this.hasAttribute('data-styled')) this.setAttribute('data-styled', 'true');

    registerToast(this);

    document.addEventListener('visibilitychange', this.#onVisibilityChange);

    // Trigger mount on next frame so transitions kick in.
    requestAnimationFrame(() => {
      this.#mounted = true;
      this.setAttribute('data-mounted', 'true');
      this.dispatchEvent(
        new CustomEvent('sonner-toast-mounted', { bubbles: true, composed: true }),
      );
      this.#startTimer();
    });
  }

  disconnectedCallback() {
    if (this.#timeoutId) clearTimeout(this.#timeoutId);
    document.removeEventListener('visibilitychange', this.#onVisibilityChange);
    unregisterToast(this);
  }

  attributeChangedCallback(name: string, _old: string | null, _val: string | null) {
    if (!this.isConnected) return;
    switch (name) {
      case 'type':
        this.#applyType();
        break;
      case 'duration':
        this.#duration = this.#readDuration();
        this.#remainingTime = this.#duration ?? TOAST_LIFETIME;
        break;
      case 'dismissible':
        this.#applyDismissible();
        break;
      case 'position':
        this.#applyPosition();
        break;
      case 'close-button':
        this.#applyCloseButton();
        break;
      case 'rich-colors':
        this.#applyRichColors();
        break;
      case 'invert':
        this.#applyInvert();
        break;
    }
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  get toastType(): ToastType {
    return (this.getAttribute('type') as ToastType) || 'default';
  }

  /** Imperative dismiss — triggers exit animation, then removes from DOM. */
  dismiss(): void {
    if (this.#removed || this.#pendingRemoval) return;
    this.#pendingRemoval = true;
    this.#removed = true;
    this.setAttribute('data-removed', 'true');
    if (this.#timeoutId) clearTimeout(this.#timeoutId);
    this.dispatchEvent(
      new CustomEvent('sonner-toast-dismissed', { bubbles: true, composed: true }),
    );
    setTimeout(() => {
      this.#restoreFocusIfInside();
      this.#onDismiss?.(this);
      this.remove();
    }, TIME_BEFORE_UNMOUNT);
  }

  /** If focus is still inside this toast at dismissal time, move it back to
   *  whatever was focused before focus first entered. Otherwise leave focus
   *  alone — the user has moved on. */
  #restoreFocusIfInside(): void {
    if (!this.#prevFocus) return;
    const active = document.activeElement;
    if (!active || !this.contains(active)) return;
    const target = this.#prevFocus as HTMLElement;
    if (!target.isConnected || typeof target.focus !== 'function') return;
    target.focus();
  }

  /** Apply new content/options. Used by toast.promise() for loading→success/error transitions. */
  update(options: ToastOptions & { title?: ToastContent; type?: ToastType }): void {
    const typeChanged = options.type !== undefined && options.type !== this.toastType;
    const wasUrgent = isUrgentType(this.toastType);
    if (options.type !== undefined) this.setAttribute('type', options.type);
    let timerNeedsReset = false;
    if (options.duration !== undefined) {
      this.setAttribute('duration', String(options.duration));
      this.#duration = options.duration;
      this.#remainingTime = options.duration;
      timerNeedsReset = true;
    } else if (typeChanged) {
      // Type changed without an explicit new duration — discard prior override
      // (e.g. the `Infinity` we set when the toast started life as 'loading')
      // so #effectiveDuration falls back through the attribute or default.
      this.#duration = null;
      this.removeAttribute('duration');
      this.#remainingTime = 0;
      timerNeedsReset = true;
    }
    if (options.dismissible !== undefined) {
      if (options.dismissible) this.setAttribute('dismissible', '');
      else this.removeAttribute('dismissible');
    }
    if (options.position !== undefined) this.setAttribute('position', options.position);
    if (options.closeButton !== undefined) {
      if (options.closeButton) this.setAttribute('close-button', '');
      else this.removeAttribute('close-button');
    }
    if (options.richColors !== undefined) {
      if (options.richColors) this.setAttribute('rich-colors', '');
      else this.removeAttribute('rich-colors');
    }
    if (options.invert !== undefined) {
      if (options.invert) this.setAttribute('invert', '');
      else this.removeAttribute('invert');
    }
    if (options.icon !== undefined) this.setIcon(options.icon);
    if (options.title !== undefined) this.setTitle(options.title);
    if (options.description !== undefined) this.setDescription(options.description);
    if (options.action !== undefined) {
      setButtonSlot(this, 'action', options.action, () => this.dismiss());
    }
    if (options.cancel !== undefined) {
      setButtonSlot(this, 'cancel', options.cancel, () => this.dismiss());
    }
    if (options.className) this.className = options.className;
    if (options.testId !== undefined) this.setAttribute('data-testid', options.testId);
    if (options.closeButtonAriaLabel !== undefined) {
      this.#closeButtonAriaLabel = options.closeButtonAriaLabel || null;
      this.#applyCloseButtonAriaLabel();
    }
    if (options.onDismiss) this.#onDismiss = options.onDismiss;
    if (options.onAutoClose) this.#onAutoClose = options.onAutoClose;
    if (timerNeedsReset) this.#resetTimer();
    // Route urgent post-mount transitions (e.g. promise loading → error)
    // through the toaster's dedicated alert region. Re-evaluation of the
    // toast's own aria-live attribute is unreliable across screen readers;
    // the alert region is fresh and consistent.
    if (this.#mounted && typeChanged && !wasUrgent && isUrgentType(this.toastType)) {
      const text = this.#getTitleText();
      if (text) {
        const toaster = this.closest('sonner-toaster') as SonnerToasterElement | null;
        toaster?.announceUrgent(text);
      }
    }
    this.dispatchEvent(new CustomEvent('sonner-toast-updated', { bubbles: true, composed: true }));
  }

  setTitle(value: ToastContent): void {
    setContent(this, 'title', value);
    this.#applyCloseButtonAriaLabel();
  }

  /** Trimmed text content of the slotted title child, or '' if none. */
  #getTitleText(): string {
    const titleEl = Array.from(this.children).find((c) => c.getAttribute('slot') === 'title');
    return titleEl?.textContent?.trim() ?? '';
  }

  /** Apply the close button's aria-label: explicit override wins, otherwise
   *  `Close: <title>` for disambiguation, falling back to `Close toast`. */
  #applyCloseButtonAriaLabel(): void {
    if (this.#closeButtonAriaLabel) {
      this.#closeBtn.setAttribute('aria-label', this.#closeButtonAriaLabel);
      return;
    }
    const text = this.#getTitleText();
    this.#closeBtn.setAttribute('aria-label', text ? `Close: ${text}` : 'Close toast');
  }

  setDescription(value: ToastContent | undefined): void {
    setContent(this, 'description', value);
  }

  setIcon(value: Node | string | null | undefined): void {
    clearSlot(this, 'icon');
    if (value == null) return;
    if (value instanceof Node) {
      if (value instanceof Element) value.setAttribute('slot', 'icon');
      this.appendChild(value);
    } else {
      // Parse the HTML string and slot its first element directly — wrapping in a
      // <span> adds inline-baseline vertical wobble that breaks the icon's vertical
      // centering against the title.
      const el = slotElementFromHTML(value, 'icon');
      if (el) this.appendChild(el);
    }
  }

  setHandlers(handlers: {
    onDismiss?: ToastOptions['onDismiss'];
    onAutoClose?: ToastOptions['onAutoClose'];
  }): void {
    this.#onDismiss = handlers.onDismiss;
    this.#onAutoClose = handlers.onAutoClose;
  }

  /** Called by the toaster to pause/resume this toast's auto-dismiss timer. */
  setPaused(paused: boolean): void {
    if (paused) this.#pauseFor('toaster');
    else this.#resumeFrom('toaster');
  }

  // ─── Internal ────────────────────────────────────────────────────────────

  #reflectSlot(name: 'icon' | 'description', slot: HTMLSlotElement) {
    const has = slot.assignedNodes().length > 0;
    if (has) this.setAttribute(`data-has-${name}`, '');
    else this.removeAttribute(`data-has-${name}`);
  }

  #applyType() {
    const type = this.toastType;
    this.setAttribute('data-type', type);
    const urgent = isUrgentType(type);
    this.setAttribute('role', urgent ? 'alert' : 'status');
    this.setAttribute('aria-live', urgent ? 'assertive' : 'polite');

    // Always clear any prior default icon — we'll re-install one below if needed.
    // (The spinner for `loading` lives in the shadow DOM; see SHADOW_TEMPLATE.)
    for (const c of Array.from(this.children)) {
      if (c.getAttribute('slot') === 'icon' && c.hasAttribute('data-sonner-default-icon'))
        this.removeChild(c);
    }

    if (type === 'loading') {
      this.setAttribute('data-promise', 'true');
      return;
    }
    this.removeAttribute('data-promise');

    const hasUserIcon = Array.from(this.children).some(
      (c) => c.getAttribute('slot') === 'icon', // any remaining slot=icon child is user-provided
    );
    if (hasUserIcon) return;

    const builtin = getTypeIcon(type);
    if (!builtin) return;
    // Parse and slot the actual SVG/spinner element directly (no span wrapper).
    const el = slotElementFromHTML(builtin, 'icon');
    if (el) {
      el.setAttribute('data-sonner-default-icon', '');
      this.appendChild(el);
    }
  }

  #applyDismissible() {
    const dismissible = this.getAttribute('dismissible') !== 'false';
    this.setAttribute('data-dismissible', String(dismissible));
  }

  #applyPosition() {
    const pos = this.getAttribute('position');
    if (!pos) return;
    const [y, x] = pos.split('-');
    if (y) this.setAttribute('data-y-position', y);
    if (x) this.setAttribute('data-x-position', x);
  }

  #applyCloseButton() {
    const show = this.hasAttribute('close-button') && this.getAttribute('close-button') !== 'false';
    this.#closeBtn.hidden = !show;
  }

  #applyRichColors() {
    const rich = this.hasAttribute('rich-colors') && this.getAttribute('rich-colors') !== 'false';
    this.setAttribute('data-rich-colors', String(rich));
  }

  #applyInvert() {
    const invert = this.hasAttribute('invert') && this.getAttribute('invert') !== 'false';
    this.setAttribute('data-invert', String(invert));
  }

  #readDuration(): number | null {
    const raw = this.getAttribute('duration');
    if (raw == null) return null;
    if (raw === 'Infinity') return Infinity;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  #effectiveDuration(): number {
    const explicit = this.#duration ?? this.#readDuration();
    if (explicit !== null) return explicit;
    // No caller-provided duration: loading toasts wait forever (they're meant to be
    // resolved by toast.promise or an explicit dismiss); everything else uses the
    // default lifetime.
    if (this.toastType === 'loading') return Infinity;
    return TOAST_LIFETIME;
  }

  #startTimer() {
    if (!this.#mounted || this.#removed) return;
    if (this.#pauseReasons.size > 0) return;
    if (this.#timeoutId !== null) return;
    const dur = this.#effectiveDuration();
    if (dur === Infinity) return;
    this.#remainingTime = this.#remainingTime > 0 ? this.#remainingTime : dur;
    this.#timerStartedAt = Date.now();
    this.#timeoutId = setTimeout(() => {
      this.#timeoutId = null;
      this.#onAutoClose?.(this);
      this.dispatchEvent(
        new CustomEvent('sonner-toast-autoclosed', { bubbles: true, composed: true }),
      );
      this.dismiss();
    }, this.#remainingTime);
  }

  /** Add a pause reason. Pauses the timer if it wasn't already paused. */
  #pauseFor(reason: PauseReason) {
    const wasUnpaused = this.#pauseReasons.size === 0;
    this.#pauseReasons.add(reason);
    if (wasUnpaused && this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
      const elapsed = Date.now() - this.#timerStartedAt;
      this.#remainingTime = Math.max(0, this.#remainingTime - elapsed);
    }
  }

  /** Remove a pause reason. Resumes the timer when the last reason is cleared. */
  #resumeFrom(reason: PauseReason) {
    if (!this.#pauseReasons.delete(reason)) return;
    if (this.#pauseReasons.size === 0 && !this.#removed) this.#startTimer();
  }

  #resetTimer() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
    this.#remainingTime = this.#effectiveDuration();
    this.#startTimer();
  }

  #onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') this.#pauseFor('doc-hidden');
    else this.#resumeFrom('doc-hidden');
  };

  // ─── Swipe ───────────────────────────────────────────────────────────────

  #isDismissible(): boolean {
    return this.getAttribute('dismissible') !== 'false';
  }

  #onPointerDown = (event: PointerEvent) => {
    if (event.button === 2) return;
    if (this.toastType === 'loading' || !this.#isDismissible()) return;
    // event.target is retargeted to the host as the event crosses the shadow boundary.
    // composedPath() preserves the actual element clicked inside shadow DOM, so we can
    // detect clicks on the close button or action/cancel buttons and skip swipe handling.
    const realTarget = event.composedPath()[0] as HTMLElement | undefined;
    if (realTarget) {
      const inButton =
        realTarget.tagName === 'BUTTON' ||
        (typeof realTarget.closest === 'function' && realTarget.closest('button'));
      if (inButton) return;
    }
    this.#dragStartTime = Date.now();
    try {
      this.setPointerCapture(event.pointerId);
    } catch {
      /* not capturable; ignore */
    }
    this.setAttribute('data-swiping', 'true');
    this.#pointerStart = { x: event.clientX, y: event.clientY };
    if (!this.#swipeDirections) {
      // Read effective position from data-y-position/data-x-position which the toaster
      // sets on every toast (whether or not the toast has its own `position` attribute).
      const y = this.getAttribute('data-y-position');
      const x = this.getAttribute('data-x-position');
      const dirs: SwipeDirection[] = [];
      if (y === 'top' || y === 'bottom') dirs.push(y);
      if (x === 'left' || x === 'right') dirs.push(x);
      this.#swipeDirections = dirs.length > 0 ? dirs : ['bottom', 'right'];
    }
  };

  #onPointerMove = (event: PointerEvent) => {
    if (!this.#pointerStart || !this.#isDismissible()) return;
    if ((window.getSelection()?.toString().length ?? 0) > 0) return;

    const yDelta = event.clientY - this.#pointerStart.y;
    const xDelta = event.clientX - this.#pointerStart.x;
    const dirs = this.#swipeDirections!;

    if (!this.#swipeDirection && (Math.abs(xDelta) > 1 || Math.abs(yDelta) > 1)) {
      this.#swipeDirection = Math.abs(xDelta) > Math.abs(yDelta) ? 'x' : 'y';
    }

    const dampen = (delta: number) => 1 / (1.5 + Math.abs(delta) / 20);

    let sx = 0;
    let sy = 0;
    if (this.#swipeDirection === 'y') {
      if (dirs.includes('top') || dirs.includes('bottom')) {
        if ((dirs.includes('top') && yDelta < 0) || (dirs.includes('bottom') && yDelta > 0)) {
          sy = yDelta;
        } else {
          const d = yDelta * dampen(yDelta);
          sy = Math.abs(d) < Math.abs(yDelta) ? d : yDelta;
        }
      }
    } else if (this.#swipeDirection === 'x') {
      if (dirs.includes('left') || dirs.includes('right')) {
        if ((dirs.includes('left') && xDelta < 0) || (dirs.includes('right') && xDelta > 0)) {
          sx = xDelta;
        } else {
          const d = xDelta * dampen(xDelta);
          sx = Math.abs(d) < Math.abs(xDelta) ? d : xDelta;
        }
      }
    }

    if (Math.abs(sx) > 0 || Math.abs(sy) > 0) this.setAttribute('data-swiped', 'true');
    this.style.setProperty('--swipe-amount-x', `${sx}px`);
    this.style.setProperty('--swipe-amount-y', `${sy}px`);
  };

  #onPointerUp = () => {
    if (this.getAttribute('data-swipe-out') === 'true' || !this.#isDismissible()) {
      this.#pointerStart = null;
      this.#swipeDirection = null;
      this.setAttribute('data-swiping', 'false');
      return;
    }
    const sx = parseFloat(this.style.getPropertyValue('--swipe-amount-x')) || 0;
    const sy = parseFloat(this.style.getPropertyValue('--swipe-amount-y')) || 0;
    const time = Math.max(1, Date.now() - this.#dragStartTime);
    const amount = this.#swipeDirection === 'x' ? sx : sy;
    const velocity = Math.abs(amount) / time;

    if (Math.abs(amount) >= SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      if (this.#swipeDirection === 'x') {
        this.setAttribute('data-swipe-direction', sx > 0 ? 'right' : 'left');
      } else {
        this.setAttribute('data-swipe-direction', sy > 0 ? 'down' : 'up');
      }
      this.setAttribute('data-swipe-out', 'true');
      this.dismiss();
    } else {
      this.style.setProperty('--swipe-amount-x', '0px');
      this.style.setProperty('--swipe-amount-y', '0px');
      this.setAttribute('data-swiped', 'false');
    }
    this.setAttribute('data-swiping', 'false');
    this.#pointerStart = null;
    this.#swipeDirection = null;
  };
}

if (typeof customElements !== 'undefined' && !customElements.get('sonner-toast')) {
  customElements.define('sonner-toast', SonnerToast);
}
