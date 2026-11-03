# Releasing 0.1.0

The package, adapters, static documentation, CI definitions and local release
checks are prepared. The [live documentation](https://tbudin.github.io/skydial/)
is deployed through GitHub Pages. npm publication requires the authenticated
maintainer to stage and approve the reviewed version. The selected package name is `skydial`, hosted in `tbudin/skydial`. The code
copyright and website ownership belong to Plain Matter Pte Ltd. Thomas Budin is
the sole human author and committer.

## Validate the reviewed candidate

```sh
npm ci
npx playwright install chromium firefox webkit
npm run test:release
npm audit --omit=dev --audit-level=low
npm pack
```

The release suite checks lint, units/SSR, the reference app, all library entries,
NodeNext consumer types, package metadata, packed type resolution, clean archive
installs, the generated site, all browser flows and the docs playground. The
clean-install test first installs only the archive and astronomy dependency,
then installs the pinned visual peers and verifies all adapters and texture
assets. Browser installation may require `--with-deps` on Linux.

Chromium, Firefox and WebKit are automated. Firefox's unsupported mobile-touch
emulation case is explicitly skipped; touch is tested in Chromium and WebKit.
Physical devices cannot be certified by desktop automation and remain a manual
smoke check for the supported device policy. Linux CI runs Firefox with a virtual
display to exercise WebGL; wrap the release suite in `xvfb-run --auto-servernum`
when running it with `CI=true` on Linux.

## Finalize naming and metadata

1. Recheck the chosen `skydial` name against npm immediately before staging.
2. Package metadata, self-imports, examples, install snippets and site npm links
   now use `skydial`. GitHub repository and documentation paths use skydial.
   Rerun the release suite after any further rename.
3. Retain version 0.1.0, review the changelog, and commit
   the reviewed source as Thomas Budin, without agent/co-author trailers.
4. Confirm the publish account with `npm whoami --registry=https://registry.npmjs.org`.

The release guard refuses private packages or a dirty checkout. It also checks
the complete Git history for Thomas Budin's personal author/committer identity,
rejects co-author/generated/session trailers and additional contributor metadata,
and verifies the code licence and website ownership credit. The release workflow
fetches the full history; direct npm publishing runs the same guard. It is
deliberately not bypassed while final release validation is incomplete.

## Publish and deploy

`.github/workflows/release.yml` is manually dispatched, uses the `npm`
environment, runs the full suite and stages the package with provenance using
npm 11.21.0 and trusted GitHub OIDC authentication. It follows the staged release
approach used by package-trends; no long-lived npm token is configured.

Configure an npm trusted publisher for this repository and `release.yml`, with
staging permission and the `npm` environment. For a brand-new name, follow npm's
new-package staged publishing setup. Staging a new name creates a public
`0.0.0-stage` placeholder, so finalize the name before dispatching. Approve the
staged 0.1.0 package on npm using the maintainer account and 2FA. Staging alone
does not publish the final version.

See [npm staged publishing](https://docs.npmjs.com/staged-publishing/) and
[trusted publishers](https://docs.npmjs.com/trusted-publishers/) for account setup.

After success, verify the exact registry version and exported files. Create the
v0.1.0 release/tag, then dispatch the documentation workflow or publish a GitHub
release to trigger it. Enable GitHub Pages with GitHub Actions as its source.
The docs workflow publishes the `site-dist` artifact built from the user's
package-site template. The native mobile app is not part of this release.
