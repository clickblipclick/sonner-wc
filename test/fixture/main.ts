/// <reference lib="dom" />
// Loaded after /sonner-wc.js, which puts `toast` on window and defines the WC.
declare global {
  interface Window {
    toast: typeof import('../../src/index.js').toast;
  }
}

const { toast } = window;
const params = new URLSearchParams(window.location.search);

// Secondary toaster for multi-toaster routing tests. Appended first so the
// primary (#toaster) ends up as the default (defaultToaster() = last registered).
const secondary = document.createElement('sonner-toaster');
secondary.id = 'secondary';
secondary.setAttribute('position', 'top-left');
document.body.appendChild(secondary);

const toaster = document.createElement('sonner-toaster');
if (params.get('position')) toaster.setAttribute('position', params.get('position')!);
if (params.get('theme')) toaster.setAttribute('theme', params.get('theme')!);
if (params.get('dir')) toaster.setAttribute('dir', params.get('dir')!);
toaster.id = 'toaster';
document.body.appendChild(toaster);

const buttons = document.getElementById('buttons')!;

function btn(testid: string, label: string, onClick: () => void) {
  const b = document.createElement('button');
  b.setAttribute('data-testid', testid);
  b.textContent = label;
  b.addEventListener('click', onClick);
  buttons.appendChild(b);
  return b;
}

// ── Basics ────────────────────────────────────────────────
btn('default-button', 'Default toast', () => toast('My Toast'));
btn('success', 'Success', () => toast.success('My Success Toast'));
btn('error', 'Error', () => toast.error('My Error Toast'));

btn('action', 'Action', () =>
  toast('My Action Toast', {
    action: { label: 'Action', onClick: () => {} },
  }),
);

btn('action-prevent', 'Action (preventDefault)', () =>
  toast('Action prevent', {
    duration: Infinity,
    action: {
      label: 'Action',
      onClick: (e) => e.preventDefault(),
    },
  }),
);

// ── Promise ───────────────────────────────────────────────
btn('promise', 'Promise', () => {
  const p = new Promise<{ name: string }>((resolve) =>
    setTimeout(() => resolve({ name: 'Sonner' }), 150),
  );
  toast.promise(p, { loading: 'Loading...', success: 'Loaded', error: 'Failed' });
});

btn('extended-promise', 'Promise (extended)', () => {
  // sonner-wc's toast.promise doesn't take per-state descriptions, so
  // mirror Sonner's extended-promise test by driving the lifecycle by hand.
  toast.loading('Loading...', { id: 'ext', description: 'Global description' });
  setTimeout(() => {
    toast.success('Sonner toast has been added', {
      id: 'ext',
      description: 'Custom description for the Success state',
    });
  }, 150);
});

btn('extended-promise-error', 'Promise (extended error)', () => {
  toast.loading('Loading...', { id: 'ext-err' });
  setTimeout(() => {
    toast.error('An error occurred', {
      id: 'ext-err',
      duration: Infinity,
      action: { label: 'Retry', onClick: (e) => e.preventDefault() },
    });
  }, 150);
});

btn('error-promise', 'Promise (Error rejection)', () => {
  const p = Promise.reject(new Error('Not implemented'));
  toast.promise(p, {
    loading: 'Loading...',
    success: 'ok',
    error: (err: Error) => `Error Raise: ${err.toString()}`,
  });
});

// ── Custom ────────────────────────────────────────────────
btn('custom', 'Custom', () =>
  toast.custom(() => {
    const div = document.createElement('div');
    div.textContent = 'jsx';
    return div;
  }),
);

// ── Dismissibility ───────────────────────────────────────
btn('non-dismissible-toast', 'Non-dismissible', () =>
  toast('Non-dismissible Toast', { dismissible: false, duration: Infinity }),
);

btn('infinity-toast', 'Infinity', () => toast('Infinity Toast', { duration: Infinity }));

// ── Callbacks ────────────────────────────────────────────
btn('auto-close-toast-callback', 'Auto-close callback', () =>
  toast('Closing soon', {
    duration: 300,
    onAutoClose: () => {
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'auto-close-el');
      document.body.appendChild(el);
    },
  }),
);

btn('dismiss-toast-callback', 'Dismiss callback', () =>
  toast('Swipe me', {
    duration: Infinity,
    onDismiss: () => {
      const el = document.createElement('div');
      el.setAttribute('data-testid', 'dismiss-el');
      document.body.appendChild(el);
    },
  }),
);

// ── Theme toggle ─────────────────────────────────────────
btn('theme-button', 'Toggle theme', () => {
  const current = toaster.getAttribute('theme') || 'light';
  toaster.setAttribute('theme', current === 'light' ? 'dark' : 'light');
});

// ── Update ───────────────────────────────────────────────
btn('update-toast', 'Update toast', () => {
  toast('My Unupdated Toast', { id: 'update-1', duration: Infinity });
  toast('My Updated Toast', { id: 'update-1', duration: Infinity });
});

btn('update-toast-duration', 'Update toast + duration', () => {
  toast('My Unupdated Toast, Updated After 3 Seconds', {
    id: 'update-d',
    duration: 3000,
  });
  setTimeout(() => {
    toast('My Updated Toast, Close After 1 Second', { id: 'update-d', duration: 1000 });
  }, 3000);
});

// ── Descriptions ─────────────────────────────────────────
btn('string-description', 'String description', () =>
  toast('Title', { description: 'string description' }),
);

btn('node-description', 'Node description', () =>
  toast('Title', {
    description: () => {
      const span = document.createElement('span');
      span.textContent = 'This is my custom Node description';
      return span;
    },
  }),
);

// ── Multi-toaster routing ───────────────────────────────
btn('toast-secondary', 'Toast → secondary', () =>
  toast('Secondary Toaster Toast', { toasterId: 'secondary', duration: Infinity }),
);
btn('toast-global', 'Toast → global', () =>
  toast('Global Toaster Toast', { duration: Infinity }),
);

btn('dismiss-all', 'Dismiss all', () => toast.dismiss());
