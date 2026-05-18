// Public API: re-exported declaratively so the entry point's exports
// survive tree-shaking. The window.toast side-effect uses a separately
// renamed import (`_toast`) — sharing a name with a re-export trips
// newer Bun bundlers into emitting broken `toast2 as toast` aliases.
export { SonnerToast } from './sonner-toast.js';
export { SonnerToaster } from './sonner-toaster.js';
export { toast } from './toast.js';

import type { SonnerToast as _SonnerToast } from './sonner-toast.js';
import type { SonnerToaster as _SonnerToaster } from './sonner-toaster.js';
import { toast as _toast } from './toast.js';
export type {
  Position,
  PromiseOptions,
  SonnerToastElement,
  SonnerToasterElement,
  SwipeDirection,
  Theme,
  ToastAction,
  ToastContent,
  ToastOptions,
  ToastType,
  ToasterOptions,
} from './types.js';

if (typeof window !== 'undefined')
  (window as Window & { toast?: typeof _toast }).toast = _toast;

declare global {
  interface HTMLElementTagNameMap {
    'sonner-toast': _SonnerToast;
    'sonner-toaster': _SonnerToaster;
  }
}
