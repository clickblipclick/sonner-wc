# Releasing sonner-wc

The release flow is tag-driven. Pushing a `v*.*.*` tag to `main` triggers
[`.github/workflows/release.yml`][release-wf], which re-runs the test suite
and publishes to npm with provenance via OIDC trusted publishing.

[release-wf]: .github/workflows/release.yml

## Cutting a release

From a clean `main` with everything merged:

```sh
bun install                       # ensure lockfile is current
bun run lint:exports              # build + publint + are-the-types-wrong
bun test && bunx playwright test  # local sanity

npm version patch                 # or minor / major
git push --follow-tags
```

`npm version` bumps `package.json`, writes a `vX.Y.Z` tag, and commits
both. Pushing with `--follow-tags` lands the commit and the tag in one
go. The tag triggers the release workflow, which publishes to npm and
opens a GitHub Release with auto-generated notes from commits since the
previous tag.

For a tarball preview before tagging:

```sh
npm pack --dry-run
```

## What the release workflow checks

- `package.json` version matches the pushed tag (e.g. `1.2.3` vs
  `v1.2.3`). A mismatch fails the run — usually a sign someone tagged
  manually without `npm version`.
- `bun run typecheck`, `bun test`, `bun run lint:exports`, and the
  Chromium Playwright suite all pass before publish.

## How publishing is configured

- **npm OIDC trusted publishing.** The npm package is configured with
  GitHub Actions as a trusted publisher pointing at this repo's
  `release.yml` workflow, so the workflow publishes without an
  `NPM_TOKEN` secret. Provenance is enabled.
- **GitHub Pages.** Source is set to GitHub Actions; deploys are driven
  by `.github/workflows/pages.yml`.

## Site deployment

`.github/workflows/pages.yml` runs on every push to `main` and rebuilds
the SvelteKit site under the `/sonner-wc` base path. The site demos the
WC from `src/` (via a Vite alias), so the live site always reflects
`HEAD` on `main` rather than the most recent npm release. If that
divergence ever causes confusion, swap the alias for a direct dependency
on the published package and pin a version.
