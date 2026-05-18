# Releasing sonner-wc

The release flow is tag-driven. CI handles publishing on every `v*.*.*` tag.

## Cutting a release

From a clean `main` with everything merged:

```sh
bun install                 # ensure lockfile is current
bun run lint:exports        # build + publint + are-the-types-wrong
bun test && bunx playwright test   # local sanity

npm version patch           # or minor / major
git push --follow-tags
```

`npm version` bumps `package.json`, writes a `vX.Y.Z` tag, and commits both.
Pushing with `--follow-tags` lands the commit + the tag in one go. The tag
triggers `.github/workflows/release.yml`, which re-runs tests, publishes
to npm with provenance, and opens a GitHub Release with auto-generated
notes from commits since the previous tag.

If you need a dry run first:

```sh
npm pack --dry-run          # shows what would land in the tarball
```

## Prerequisites (one-time)

1. **First publish must be manual** — npm OIDC trusted publishing requires
   the package to already exist. From a clean main:
   ```sh
   bun run lint:exports
   npm publish --access public
   ```
2. **Wire up OIDC** — on npmjs.com, go to the package's Settings →
   Trusted Publishers → Add. Pick GitHub Actions, point at this repo and
   the `release.yml` workflow. After this, no `NPM_TOKEN` secret needed.
3. **Enable GitHub Pages** — Settings → Pages → Source: GitHub Actions.

## What the release workflow checks

- `package.json` version matches the pushed tag (e.g. `1.2.3` vs `v1.2.3`).
  If they disagree the run fails fast — usually because someone forgot
  `npm version` and tagged manually.
- `bun run typecheck`, `bun test`, `bun run lint:exports`, and the
  Chromium Playwright suite all pass before publish.

## Site deployment

`.github/workflows/pages.yml` runs on every push to `main` and rebuilds
the SvelteKit site under the `/sonner-wc` base path. The site demos the
WC from `src/` (via Vite alias) so it always reflects HEAD, not the most
recent npm release. If that ever causes confusion, swap the alias for a
direct dependency on the published package and pin a version.
