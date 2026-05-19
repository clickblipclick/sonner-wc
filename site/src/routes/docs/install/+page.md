<svelte:head><title>Install · sonner-wc</title></svelte:head>

# Install

Three ways to add `sonner-wc` to a page.

## From a CDN

Drop one `<script>` tag and one element into any HTML page:

```html
<script type="module" src="https://unpkg.com/sonner-wc/dist/sonner-wc.bundle.js"><\/script>
<sonner-toaster position="bottom-right" theme="system"></sonner-toaster>

<script type="module">
  import { toast } from 'https://unpkg.com/sonner-wc';
  document.querySelector('button').addEventListener('click', () => toast.success('Hello!'));
</script>
```

## From npm

```sh
npm install sonner-wc   # or: bun add / pnpm add / yarn add
```

Then import it once — the side-effect registers the two custom elements:

```js
import { toast } from 'sonner-wc';
// <sonner-toaster> and <sonner-toast> custom elements are
// registered as a side effect of the import.
```

## Where to place it

Put `<sonner-toaster>` once, near the end of `<body>`. It uses
`position: fixed`, so the exact spot in the DOM rarely matters — with one
caveat.

<div role="alert" class="alert items-start">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 shrink-0 stroke-current">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <div class="prose">
        <h4 class="mt-0">Heads up</h4>

        Ancestors with `transform`, `filter`, `perspective`, `backdrop-filter`, `will-change` (any of those), or `contain: paint/layout/strict` become the containing block for `position: fixed`, so the toaster anchors to them (and can get clipped by `overflow: hidden`) instead of the viewport.

        **Fix:** move `&lt;sonner-toaster&gt;` to the document root.
    </div>
</div>

## Framework integration

### React

If you're writing React, use the original [Sonner](https://sonner.emilkowal.ski) —
it's the same UX, designed for React from the start, with proper JSX types
and refs. We're a port _of_ Sonner, not a replacement.

### Vue

```html
<script setup>
import 'sonner-wc';
import { toast } from 'sonner-wc';
</script>

<template>
  <sonner-toaster position="bottom-right" theme="system" />
  <button @click="toast.success('Saved!')">Save</button>
</template>
```

### Svelte

```svelte
<script>
  import 'sonner-wc';
  import { toast } from 'sonner-wc';
</script>

<sonner-toaster position="bottom-right" theme="system" />
<button on:click={() => toast.success('Saved!')}>Save</button>
```
