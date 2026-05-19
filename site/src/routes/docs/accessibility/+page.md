<svelte:head><title>Accessibility · sonner-wc</title></svelte:head>

# Accessibility

`sonner-wc` ships with reasonable ARIA defaults so you don't have to wire them yourself.

## The toaster is a labelled region

The host advertises itself as `role="region"` with `aria-label="Notifications"`. Override the name with the `container-aria-label` attribute — and it's reactive, so changing it after mount updates the label.

```html
<sonner-toaster container-aria-label="App notifications"></sonner-toaster>
```

## Each toast is announced atomically

Toasts carry `aria-atomic="true"`, so screen readers re-announce the whole toast when its content changes (e.g. a `toast.promise` going from `loading` to `success`), not just the diff. The polite vs. assertive `aria-live` is picked from the toast type — `error` / `warning` are assertive, the rest polite.

## Stacked-behind toasts are hidden when collapsed

When the stack is collapsed (default), only the front toast is exposed to screen readers — toasts behind it are marked `aria-hidden="true"` so users aren't bombarded by visually obscured items. Expanding the stack (hover, focus, or the configured `hotkey`) clears `aria-hidden` so users can navigate the full set.

## Urgent post-mount transitions are re-announced

If a toast becomes urgent *after* mounting — for instance a `toast.promise` resolving from `loading` to `error` — the new title is routed through a dedicated assertive live region inside the toaster's shadow root. Re-evaluating a toast's own `aria-live` is unreliable across screen readers; this dedicated region guarantees the urgent message lands.

If you ever need to trigger this yourself:

```js
document.querySelector('sonner-toaster').announceUrgent('Connection lost');
```

## Keyboard navigation

The toaster and each toast are keyboard-reachable:

- **Hotkey** (default `Alt+T`, configurable via the `hotkey` attribute) expands the stack and moves focus into the toaster region.
- From the toaster, **Tab** moves into the front toast; subsequent Tabs reach the action, cancel, and close buttons inside the shadow root.
- A visible `:focus-visible` ring is drawn on the toaster region and each focused toast, plus on the action / cancel / close buttons, so keyboard users always see where focus is.

The hotkey isn't exactly self-advertising — keyboard shortcuts rarely are. So the toaster reflects its current shortcut in two places to make it discoverable:

- `aria-keyshortcuts` (e.g. `"Alt+T"`) — screen readers announce it when the region is reached.
- `title` (e.g. `"Press Alt+T to expand notifications"`) — sighted users see it on hover.

Both update automatically if you change the `hotkey` attribute. Set your own `aria-keyshortcuts` or `title` on the host to override.

### Avoiding collisions with consumer shortcuts

The hotkey handler is a `keydown` listener on `document`. It tries hard to stay out of the consumer's way:

- **Strict modifier match.** Only fires when exactly the listed modifiers are held. `Alt+T` will not fire on `Ctrl+Alt+T` or `Shift+Alt+T`.
- **Skips while typing.** Ignored when the event target is an `<input>`, `<textarea>`, `<select>`, or any `contenteditable` element.
- **Defers to consumer handlers.** If an earlier listener calls `event.preventDefault()`, sonner-wc treats the key as claimed and does nothing.
- **Opt-out.** Set `hotkey=""` (or `hotkey="none"`) to disable the shortcut entirely. The document listener stays registered (Escape-to-collapse still works), but no key combination will expand the stack. The `aria-keyshortcuts` / `title` hints are removed in this mode too.

```html
<!-- Disable entirely -->
<sonner-toaster hotkey="none"></sonner-toaster>

<!-- Use a less collision-prone chord -->
<sonner-toaster hotkey="altKey+shiftKey+KeyN"></sonner-toaster>
```

## Escape dismisses the focused toast

If focus is inside a toast, pressing **Escape** dismisses that toast. The event is stopped from propagating, so the toaster's stack-collapse hotkey (which also reacts to Escape when focus is on the toaster itself but not inside a toast) still works as expected.

## Focus is restored on dismiss

When a toast captures focus (via Tab or programmatic focus) and is then dismissed, focus is restored to wherever it was before the toast was entered. Keyboard users no longer get stranded on `<body>` after dismissing a toast they had tabbed into.

## Close button has an accessible name

The shadow-DOM close button gets `aria-label="Close: <title>"` by default (or `Close toast` when there is no title). Override per-toast with `closeButtonAriaLabel`:

```js
toast('Saved', { closeButtonAriaLabel: 'Dismiss save notification' });
```

The label is kept in sync across `toast.promise` transitions.
