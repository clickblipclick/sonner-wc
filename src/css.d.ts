// Lets TypeScript treat `.css` imports as strings.
// Bun's bundler resolves these to the file's text content when imported with
// `with { type: 'text' }`. At runtime we feed each string to a CSSStyleSheet via
// replaceSync() so the result can be adopted by shadow roots.

declare module '*.css' {
  const content: string;
  export default content;
}
