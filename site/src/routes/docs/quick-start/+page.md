<script>
  import { resolve } from '$app/paths';

  // Resolved here rather than inline: mdsvex turns quotes in the markdown
  // body into typographic ones, which breaks inline expressions.
  const api = resolve('/docs/api');
  const theming = resolve('/docs/theming');
</script>

<svelte:head><title>Quick start · sonner-wc</title></svelte:head>

# Quick start

Get a toast on screen in 30 seconds.

## 1. Install

```sh
npm install sonner-wc   # or: bun add / pnpm add / yarn add
```

## 2. Place a toaster

Add one `<sonner-toaster>` near the end of `<body>`:

```html
<sonner-toaster position="bottom-right" theme="system"></sonner-toaster>
```

## 3. Import and call `toast()`

```js
import { toast } from 'sonner-wc';
toast('Hello, world!');
```

That's it. Calling `toast()` anywhere on the page after that will show a
toast. See the <a href={api}>API reference</a> for variants, options, and
events.

## What next?

- Tweak position, duration, and rich colors on `<sonner-toaster>` —
  see <a href={api}>API</a>.
- Override colors and dimensions via CSS custom properties —
  see <a href={theming}>Theming</a>.
