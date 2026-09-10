# Vercel static deployment

Configuration: Other framework (`framework: null`), repository root, build command `npm run build`, output `public`, install command `npm ci --include=dev` to provide the pinned TypeScript compiler. Runtime remains classic JavaScript; the build first type-checks and compiles the three event scripts, then packaging copies referenced public HTML/CSS/JS. See [TypeScript development](TYPESCRIPT.md). Private `.omo`, evidence, logs, secrets, tests and server code are not served from the output. The local server also allows only game assets referenced by the HTML.

## Production deployment · 2026-09-09

Play at [maple-forest-ten.vercel.app](https://maple-forest-ten.vercel.app). The Vercel project is connected to GitHub main. Initial production deploy uses merge commit `d80f413931548c7f7e3739d588455a96b70f8948`; its game tree matches reviewed `236a532`. The leader opened the production game successfully.

Independent HTTP verification at 2026-09-09T08:24:36.203Z: all 29 referenced HTML/CSS/JS files returned 200 and each SHA-256 matched its blob at the deployed commit. Private team paths, tests and .env returned 404 (five probes).

Production desktop browser smoke passed: a new archer/multishot run accepted attack and skill inputs, then pause/reload restored the same build and stage 1 with MP 43.2 and skill cooldown 1.7 seconds. Mobile Chrome emulation at 390×844 passed touch archer/pierce start, dodge/attack, JSON export, settings changes and reload preserving job/build/seed/stage/SFX. Both checks reported no console errors.

Published archer/pierce and mage/frost keyboard probes each reached stage 5 with their effects observed and no errors; their 29 response source hashes matched the reviewed game.

A separate source-hashed final-code warrior/bleed run completed all 40 stages using UI/keyboard automation in 1687.901 seconds wall time (28m07.901s), 1503.633 seconds active time (25m03.633s), with no state edits or time acceleration. This is below 30 minutes and does not establish a human 30–45 minute duration. It ended at HP 426/440 with 42 potions (started with 5), so late-game supply and pressure still need balancing. Physical devices/Safari and broader human playtesting remain unverified. See the [verification record](../검증.md) for exact scope.

## Redeploy and verify

1. Run `npm test`, then `npm run build` and inspect `public/`. The initial deployment packaged 29 public game files.
2. Sign into Vercel in the browser and import the intended Git repository. Select its game repository root and Other framework. Configuration in `vercel.json` supplies build/output settings.
3. Alternatively use an installed authenticated Vercel CLI: `vercel deploy --prod` from the repository root. Inspect the selected account and project before accepting creation/linking.
4. Open the returned production URL. Confirm every referenced asset returns 200, the game starts, save export/import works, and reload restores a run. Confirm `/.omo/`, `/tests/` and environment files return 404.
5. Record the actual verified URL and commit here. A successful local package is not a successful public deployment.

Git repository connection enables future deployment on pushes; the Vercel account must have repository access. Browser saves at localhost/file URLs do not transfer to a new origin: export and import JSON.

Official references checked: [Build configuration](https://vercel.com/docs/builds/configure-a-build), [CLI deploy](https://vercel.com/docs/cli/deploy). Vercel serves only the configured output directory; cache headers require revalidation so updates do not leave mixed script versions.
