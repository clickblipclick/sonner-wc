import rehypeSlug from 'rehype-slug';
import rehypeShiki from '@shikijs/rehype';

/** @type {import('mdsvex').MdsvexOptions} */
export default {
  extensions: ['.md'],
  // Pass a truthy `highlight` (with a null highlighter) instead of `false`
  // so mdsvex skips its internal `escape_code` step. With `false`, mdsvex
  // HTML-encodes <, >, {, } in fenced code before rehype-shiki sees them,
  // which breaks tokenization for html/svelte. After shiki runs we re-encode
  // those characters in its output text nodes so Svelte's compiler doesn't
  // try to parse them as components.
  highlight: { highlighter: null },
  rehypePlugins: [
    rehypeSlug,
    [
      rehypeShiki,
      {
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
        transformers: [
          {
            pre(node) {
              if (node.properties) delete node.properties.tabindex;
            },
            // Encode characters Svelte's compiler would otherwise try to parse
            // as expressions / element starts inside the highlighted output.
            span(node) {
              for (const child of node.children) {
                if (child.type === 'text') {
                  child.value = child.value
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/\{/g, '&#123;')
                    .replace(/\}/g, '&#125;');
                  child.type = 'raw';
                }
              }
            },
          },
        ],
      },
    ],
  ],
};
