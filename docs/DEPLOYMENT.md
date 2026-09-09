# Vercel static deployment

Configuration: Other framework (`framework: null`), repository root, build command `npm run build`, output `public`, no dependency installation. Runtime remains classic JavaScript; packaging only copies referenced public HTML/CSS/JS. Private `.omo`, evidence, logs, secrets, tests and server code are not served from the output. The local server also allows only game assets referenced by the HTML.

## Status at 2026-09-09

Build and configuration are prepared. No public deployment URL has been created or verified yet. Initial local checks found no CLI authentication, but the leader subsequently confirmed an authenticated Vercel Hobby team in the browser. Repository import and publication will proceed after the reviewed code is pushed. Do not commit authentication files or paste tokens into source.

## Deploy after review and account login

1. Run `npm test`, then `npm run build` and inspect `public/`.
2. Sign into Vercel in the browser and import the intended Git repository. Select its game repository root and Other framework. Configuration in `vercel.json` supplies build/output settings.
3. Alternatively use an installed authenticated Vercel CLI: `vercel deploy --prod` from the repository root. Inspect the selected account and project before accepting creation/linking.
4. Open the returned production URL. Confirm every referenced asset returns 200, the game starts, save export/import works, and reload restores a run. Confirm `/.omo/`, `/tests/` and environment files return 404.
5. Record the actual verified URL and commit here. A successful local package is not a successful public deployment.

Git repository connection enables future deployment on pushes; the Vercel account must have repository access. Browser saves at localhost/file URLs do not transfer to a new origin: export and import JSON.

Official references checked: [Build configuration](https://vercel.com/docs/builds/configure-a-build), [CLI deploy](https://vercel.com/docs/cli/deploy). Vercel serves only the configured output directory; cache headers require revalidation so updates do not leave mixed script versions.
