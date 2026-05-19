# sonner-wc

[Sonner](https://github.com/emilkowalski/sonner)'s toast UX as a framework-agnostic web component.
Drop it into anything — vanilla HTML, Vue, Svelte, htmx — same API, same look.

```html
<script type="module" src="https://unpkg.com/sonner-wc/dist/sonner-wc.bundle.js"></script>

<sonner-toaster position="bottom-right" theme="system" rich-colors></sonner-toaster>

<script type="module">
  import { toast } from 'sonner-wc';
  toast.success('Saved!', { description: 'Your changes are live.' });
</script>
```

## Install

```sh
npm install sonner-wc           # or bun / pnpm / yarn
```

ESM only. Modern browsers (last two versions of Chrome, Firefox, Safari, Edge).

## API

### The `<sonner-toaster>` host

Place once, anywhere in the page. Configure with attributes.

| Attribute        | Values                                                                           | Default        |
| ---------------- | -------------------------------------------------------------------------------- | -------------- |
| `position`       | `top-left` `top-center` `top-right` `bottom-left` `bottom-center` `bottom-right` | `bottom-right` |
| `theme`          | `light` `dark` `system`                                                          | `light`        |
| `rich-colors`    | presence flag                                                                    | off            |
| `close-button`   | presence flag (applies to all toasts)                                            | off            |
| `invert`         | presence flag                                                                    | off            |
| `dir`            | `ltr` `rtl` `auto`                                                               | `auto`         |
| `gap`            | number (px) between stacked toasts                                               | `14`           |
| `duration`       | default lifetime in ms (per-toast override wins)                                 | `4000`         |
| `visible-toasts` | how many toasts fan out vs. stack behind                                         | `3`            |
| `offset`         | viewport gutter; px number or CSS length                                         | `24px`         |
| `mobile-offset`  | gutter under 600px                                                               | `16px`         |
| `hotkey`         | `Alt+KeyT`-style chord that expands the stack; `""` or `"none"` disables it      | `altKey+KeyT`  |
| `container-aria-label` | Accessible name for the toaster region. Reactive — changes after mount take effect. | `Notifications` |

### The `toast()` helper

```ts
import { toast } from 'sonner-wc';

toast('Default message');
toast.success('Saved', { description: 'Looks good.' });
toast.error('Oops', { action: { label: 'Retry', onClick: () => retry() } });
toast.warning('Storage almost full');
toast.info('You have a new message');
toast.loading('Uploading…', { id: 'job-1' });

// Update in place by reusing an id:
toast.success('Done', { id: 'job-1' });

// Async with automatic loading → success/error:
toast.promise(api.save(), {
  loading: 'Saving…',
  success: (data) => `Saved as ${data.name}`,
  error: (err) => `Couldn't save: ${err.message}`,
});

// Anything custom:
toast.custom((id) => {
  const el = document.createElement('div');
  el.innerHTML = `<strong>Custom</strong> content #${id}`;
  return el;
});

// Dismiss programmatically:
toast.dismiss('job-1'); // by id
toast.dismiss(); // all
```

The returned element is the `<sonner-toast>` itself. You can mutate it directly — set
attributes, add children, call `.dismiss()`, etc.

### `toast()` options

The second argument to `toast()` (and its variants) accepts:

| Option                 | Type                                | Notes                                                                                          |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                   | `string \| number`                  | Reuse to update a toast in place; pass the same `id` again to `toast.*()`.                     |
| `toasterId`            | `string`                            | DOM `id` of a specific `<sonner-toaster>` to route this toast to. Falls back to the default.   |
| `testId`               | `string`                            | Set as `data-testid` on the toast host. Survives promise loading → success/error transitions.  |
| `closeButtonAriaLabel` | `string`                            | Accessible name for the close button. Defaults to `Close: <title>` (or `Close toast`).         |
| `description`          | `string \| Node \| () => …`         | Secondary text.                                                                                |
| `duration`             | `number` (ms) or `Infinity`         | Lifetime override.                                                                             |
| `dismissible`          | `boolean`                           | Set `false` to disable swipe / close-button dismissal.                                         |
| `position`             | same as toaster                     | Per-toast position override.                                                                   |
| `closeButton`          | `boolean`                           | Per-toast override of the toaster's `close-button` flag.                                       |
| `richColors`           | `boolean`                           | Force rich colors on this toast.                                                               |
| `invert`               | `boolean`                           | Force inverted colors on this toast.                                                           |
| `icon`                 | `Node \| string`                    | Override the icon picked from `type`.                                                          |
| `className`            | `string`                            | Extra class applied to the toast host.                                                         |
| `action` / `cancel`    | `{ label, onClick }` or `HTMLElement` | Right/left button. Pass an element for full control.                                        |
| `onDismiss`            | `(el) => void`                      | Called when the toast is dismissed (manually or via `toast.dismiss`).                          |
| `onAutoClose`          | `(el) => void`                      | Called when the duration timer fires.                                                          |

## Accessibility

`sonner-wc` ships with reasonable defaults so you don't have to wire ARIA
yourself:

- The toaster is a labelled `region` (`aria-label="Notifications"` by
  default; override with `container-aria-label`).
- Each toast carries `aria-atomic="true"` so screen readers re-announce the
  whole toast when its content changes (e.g. `toast.promise` loading →
  success/error), not just the diff.
- When the stack is collapsed, toasts behind the front one are
  `aria-hidden="true"` so users aren't bombarded by visually obscured
  toasts. Expanding the stack (hover, focus, or the configured `hotkey`)
  reveals them.
- Urgent transitions that happen *after* mount (e.g. a `loading` toast
  becoming an `error`) are re-announced through a dedicated assertive
  live region inside the toaster's shadow root. Re-evaluating a toast's
  own `aria-live` is unreliable across screen readers; this region
  guarantees the message lands.
- Pressing **Escape** while focus is inside a toast dismisses it.
- When a toast that captured focus is dismissed, focus is restored to
  the element that was focused before the toast was entered — no more
  stranded keyboard users on `<body>`.
- Close buttons get an accessible name automatically (`Close: <title>`),
  or whatever `closeButtonAriaLabel` you pass.
- The toaster reflects its `hotkey` (default `Alt+T`) as both
  `aria-keyshortcuts` and a `title` tooltip so the shortcut is
  discoverable to screen-reader users and sighted users alike. A
  `:focus-visible` ring shows where focus lands when the hotkey is
  pressed.

### Declarative form

You can also build toasts as plain HTML and append them to a toaster:

```html
<sonner-toaster id="t" position="bottom-right"></sonner-toaster>

<script>
  const el = document.createElement('sonner-toast');
  el.setAttribute('type', 'success');
  el.setAttribute('duration', '4000');
  el.innerHTML = `
    <span slot="title">Saved!</span>
    <span slot="description">Your changes are live.</span>
    <button slot="action">View</button>
  `;
  document.getElementById('t').appendChild(el);
</script>
```

### Slots on `<sonner-toast>`

| Slot          | Purpose                                      |
| ------------- | -------------------------------------------- |
| `title`       | Primary text                                 |
| `description` | Secondary text                               |
| `icon`        | Icon override (otherwise picked from `type`) |
| `action`      | Right-aligned action button                  |
| `cancel`      | Left-aligned cancel button                   |

### Theming

All colors are CSS custom properties on the toaster. Override them in your own
CSS to restyle:

```css
sonner-toaster {
  --normal-bg: #1a1a1a;
  --normal-border: #2a2a2a;
  --normal-text: #fafafa;
  --success-bg: #042f2e;
  --success-text: #5eead4;
  --border-radius: 12px;
  --width: 400px;
}
```

## Development

```sh
bun install
bun run dev      # builds with watch + serves demo at http://localhost:3000
bun test         # runs unit tests
bun run build    # produces dist/
```

## Credits

UI behavior and visual design are direct ports of [Sonner](https://github.com/emilkowalski/sonner) by Emil Kowalski.
This package adapts that work into a framework-agnostic web component.

MIT.
