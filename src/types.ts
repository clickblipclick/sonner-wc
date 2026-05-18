export type ToastType = 'normal' | 'default' | 'success' | 'info' | 'warning' | 'error' | 'loading';
export type Theme = 'light' | 'dark' | 'system';
export type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
export type SwipeDirection = 'top' | 'right' | 'bottom' | 'left';

/** Content that can be passed as a title, description, or button label.
 *  Strings render as text; HTMLElement gets appended; functions are called and their return value used. */
export type ToastContent = string | Node | (() => string | Node);

export interface ToastAction {
  label: string;
  onClick?: (event: MouseEvent) => void;
}

export interface ToastOptions {
  id?: string | number;
  /** Route this toast to a specific `<sonner-toaster>` by its DOM `id`.
   *  Falls back to the default toaster if no element with that id is a toaster. */
  toasterId?: string;
  /** Set as `data-testid` on the toast host element. Survives promise transitions. */
  testId?: string;
  /** Accessible name for this toast's close button. Defaults to `Close: <title>`
   *  (or `Close toast` when there is no title). */
  closeButtonAriaLabel?: string;
  description?: ToastContent;
  duration?: number;
  dismissible?: boolean;
  position?: Position;
  closeButton?: boolean;
  richColors?: boolean;
  invert?: boolean;
  icon?: Node | string;
  className?: string;
  action?: ToastAction | HTMLElement;
  cancel?: ToastAction | HTMLElement;
  onDismiss?: (toastEl: SonnerToastElement) => void;
  onAutoClose?: (toastEl: SonnerToastElement) => void;
}

export interface PromiseOptions<T> extends Omit<ToastOptions, 'description'> {
  loading: ToastContent;
  success?: ToastContent | ((data: T) => ToastContent);
  error?: ToastContent | ((err: unknown) => ToastContent);
  description?: ToastContent | ((dataOrError: T | unknown) => ToastContent);
  finally?: () => void | Promise<void>;
}

export interface ToasterOptions {
  position?: Position;
  theme?: Theme;
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
  gap?: number;
  visibleToasts?: number;
  closeButton?: boolean;
  invert?: boolean;
  dir?: 'ltr' | 'rtl' | 'auto';
  hotkey?: readonly string[];
  offset?:
    | string
    | number
    | {
        top?: string | number;
        right?: string | number;
        bottom?: string | number;
        left?: string | number;
      };
  mobileOffset?:
    | string
    | number
    | {
        top?: string | number;
        right?: string | number;
        bottom?: string | number;
        left?: string | number;
      };
  swipeDirections?: SwipeDirection[];
  containerAriaLabel?: string;
}

export interface SonnerToastElement extends HTMLElement {
  toastId: string | number;
  toastType: ToastType;
  dismiss(): void;
  update(options: ToastOptions & { title?: ToastContent; type?: ToastType }): void;
}

export interface SonnerToasterElement extends HTMLElement {
  /** Append a freshly-built sonner-toast element. Returns the element for chaining/updating. */
  addToast(el: SonnerToastElement): SonnerToastElement;
  dismissAll(): void;
}
