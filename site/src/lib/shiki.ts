import { codeToHtml } from 'shiki';

const SHIKI_OPTS = {
  themes: { light: 'github-light', dark: 'github-dark' },
  defaultColor: false as const,
  transformers: [
    {
      pre(node: { properties?: Record<string, unknown> }) {
        if (node.properties) delete node.properties.tabindex;
      },
    },
  ],
};

export function highlight(code: string, lang: string) {
  return codeToHtml(code, { lang, ...SHIKI_OPTS });
}
