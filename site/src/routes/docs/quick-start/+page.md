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
toast. See the [API reference](/docs/api) for variants, options, and
events.

## What next?

- Tweak position, duration, and rich colors on `<sonner-toaster>` —
  see [API](/docs/api).
- Override colors and dimensions via CSS custom properties —
  see [Theming](/docs/theming).
