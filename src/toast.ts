import { defaultToaster, dismissAllToasts, getToast, nextToastId } from './registry.js';
import { SonnerToast } from './sonner-toast.js';
import { SonnerToaster } from './sonner-toaster.js';
import type {
  PromiseOptions,
  SonnerToastElement,
  ToastContent,
  ToastOptions,
  ToastType,
} from './types.js';

interface CreateOptions extends ToastOptions {
  title?: ToastContent;
  type?: ToastType;
}

function ensureToaster(toasterId?: string): SonnerToaster {
  if (toasterId) {
    const byId = document.getElementById(toasterId);
    if (byId instanceof SonnerToaster) return byId;
  }
  let host = defaultToaster() as SonnerToaster | undefined;
  if (!host) {
    host = document.createElement('sonner-toaster') as SonnerToaster;
    document.body.appendChild(host);
  }
  return host;
}

function buildOrUpdate(options: CreateOptions): SonnerToastElement {
  const id = options.id ?? nextToastId();
  const existing = getToast(id);
  if (existing) {
    existing.update(options);
    return existing;
  }
  const el = document.createElement('sonner-toast') as SonnerToast;
  el.toastId = id;
  el.update(options);
  el.setHandlers({ onDismiss: options.onDismiss, onAutoClose: options.onAutoClose });
  ensureToaster(options.toasterId).addToast(el);
  return el;
}

function variant(type: ToastType) {
  return (message: ToastContent, opts?: ToastOptions): SonnerToastElement =>
    buildOrUpdate({ ...opts, type, title: message });
}

function basic(message: ToastContent, opts?: ToastOptions): SonnerToastElement {
  return buildOrUpdate({ ...opts, type: 'default', title: message });
}

function dismiss(id?: string | number): void {
  if (id !== undefined) {
    getToast(id)?.dismiss();
    return;
  }
  dismissAllToasts();
}

function custom(
  builder: (id: string | number) => HTMLElement,
  opts?: ToastOptions,
): SonnerToastElement {
  const id = opts?.id ?? nextToastId();
  const el = document.createElement('sonner-toast') as SonnerToast;
  el.toastId = id;
  el.setAttribute('data-styled', 'false');
  if (opts?.duration !== undefined) el.setAttribute('duration', String(opts.duration));
  if (opts?.dismissible === false) el.setAttribute('dismissible', 'false');
  if (opts?.position) el.setAttribute('position', opts.position);
  if (opts?.testId !== undefined) el.setAttribute('data-testid', opts.testId);
  const content = builder(id);
  el.appendChild(content);
  el.setHandlers({ onDismiss: opts?.onDismiss, onAutoClose: opts?.onAutoClose });
  ensureToaster(opts?.toasterId).addToast(el);
  return el;
}

async function resolveContent<T>(
  value: ToastContent | ((arg: T) => ToastContent) | undefined,
  arg: T,
): Promise<ToastContent | undefined> {
  if (value === undefined) return undefined;
  if (typeof value === 'function') {
    // ToastContent allows zero-arg functions too; distinguish by length.
    return (value as (a: T) => ToastContent).length === 0
      ? (value as () => ToastContent)()
      : (value as (a: T) => ToastContent)(arg);
  }
  return value;
}

function promise<T>(
  promiseOrFn: Promise<T> | (() => Promise<T>),
  options: PromiseOptions<T>,
): SonnerToastElement & { unwrap: () => Promise<T> } {
  const id = options.id ?? nextToastId();
  // Carry forward everything except the promise-specific resolver fields when building the toast.
  const { loading: _l, success: _s, error: _e, description: _d, finally: _f, ...rest } = options;
  const loadingEl = buildOrUpdate({
    ...rest,
    id,
    type: 'loading',
    title: options.loading,
    duration: Infinity,
    dismissible: options.dismissible ?? false,
  });

  const work = Promise.resolve(typeof promiseOrFn === 'function' ? promiseOrFn() : promiseOrFn);

  let result: ['resolve', T] | ['reject', unknown] | null = null;

  const settled = work
    .then(async (value) => {
      result = ['resolve', value];
      const title = await resolveContent(options.success, value);
      const desc = await resolveContent(options.description, value);
      if (title !== undefined) {
        loadingEl.update({
          ...rest,
          id,
          type: 'success',
          title,
          description: desc,
          duration: options.duration,
          dismissible: options.dismissible ?? true,
        });
      } else {
        loadingEl.dismiss();
      }
    })
    .catch(async (err) => {
      result = ['reject', err];
      const title = await resolveContent(options.error, err);
      const desc = await resolveContent(options.description, err);
      if (title !== undefined) {
        loadingEl.update({
          ...rest,
          id,
          type: 'error',
          title,
          description: desc,
          duration: options.duration,
          dismissible: options.dismissible ?? true,
        });
      } else {
        loadingEl.dismiss();
      }
    })
    .finally(() => options.finally?.());

  const unwrap = () =>
    new Promise<T>((resolve, reject) => {
      settled.then(() => {
        if (!result) return reject(new Error('promise toast settled without a result'));
        if (result[0] === 'resolve') resolve(result[1]);
        else reject(result[1]);
      });
    });

  return Object.assign(loadingEl, { unwrap });
}

export const toast = Object.assign(basic, {
  success: variant('success'),
  error: variant('error'),
  info: variant('info'),
  warning: variant('warning'),
  loading: (message: ToastContent, opts?: ToastOptions) =>
    buildOrUpdate({
      ...opts,
      type: 'loading',
      title: message,
      duration: opts?.duration ?? Infinity,
    }),
  message: basic,
  promise,
  custom,
  dismiss,
  getToast,
});
