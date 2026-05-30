export type NavItem = { label: string; href: string };
export type NavGroup = { title: string; items: NavItem[] };

export const docsNav: NavGroup[] = [
  {
    title: 'Getting Started',
    items: [
      { label: 'Install', href: '/docs/install' },
      { label: 'Quick start', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { label: 'API', href: '/docs/api' },
      { label: 'Theming', href: '/docs/theming' },
      { label: 'Accessibility', href: '/docs/accessibility' },
      { label: 'Playground', href: '/playground' },
    ],
  },
];

export function flatDocs(): NavItem[] {
  return docsNav.flatMap((g) => g.items);
}

export function prevNext(href: string): { prev?: NavItem; next?: NavItem } {
  const flat = flatDocs();
  const i = flat.findIndex((x) => x.href === href);
  if (i === -1) return {};
  return { prev: flat[i - 1], next: flat[i + 1] };
}
