import type { SonnerToastElement, SonnerToasterElement } from './types.js';

/** Tracks toasts and toasters by id so the toast() helper can find and update them
 *  across multiple toasters and from anywhere in the module. */

const toastsById = new Map<string | number, SonnerToastElement>();
const toasters = new Set<SonnerToasterElement>();

let counter = 1;

export function nextToastId(): number {
  return counter++;
}

export function registerToast(el: SonnerToastElement): void {
  toastsById.set(el.toastId, el);
}

export function unregisterToast(el: SonnerToastElement): void {
  const current = toastsById.get(el.toastId);
  if (current === el) toastsById.delete(el.toastId);
}

export function getToast(id: string | number): SonnerToastElement | undefined {
  return toastsById.get(id);
}

export function registerToaster(el: SonnerToasterElement): void {
  toasters.add(el);
}

export function unregisterToaster(el: SonnerToasterElement): void {
  toasters.delete(el);
}

/** Find a toaster element to host a new toast. Prefer the most-recently-connected one. */
export function defaultToaster(): SonnerToasterElement | undefined {
  let last: SonnerToasterElement | undefined;
  for (const t of toasters) last = t;
  return last;
}

export function allToasters(): readonly SonnerToasterElement[] {
  return Array.from(toasters);
}

export function dismissAllToasts(): void {
  for (const t of toasters) t.dismissAll();
}
