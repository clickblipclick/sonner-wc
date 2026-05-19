// SSR-safe: when imported in Node without a DOM, fall back to a no-op base class.
// The elements won't function server-side but the import won't crash.
export const HTMLElementCtor: typeof HTMLElement =
  typeof HTMLElement !== 'undefined' ? HTMLElement : (class {} as unknown as typeof HTMLElement);
