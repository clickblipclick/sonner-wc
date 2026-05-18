import { SonnerToast } from './sonner-toast.js';
import { SonnerToaster } from './sonner-toaster.js';
import { toast } from './toast.js';

export { SonnerToast } from './sonner-toast.js';
export { SonnerToaster } from './sonner-toaster.js';
export { toast } from './toast.js';
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

if (typeof window !== 'undefined') (window as Window & { toast?: typeof toast }).toast = toast;

declare global {
  interface HTMLElementTagNameMap {
    'sonner-toast': SonnerToast;
    'sonner-toaster': SonnerToaster;
  }
}
