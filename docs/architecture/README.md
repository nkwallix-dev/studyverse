# Studyverse architecture

## Current boundaries

The Angular app is a standalone single-page application. `app.ts` is still the
composition root and currently owns view selection, local profile state,
authentication orchestration, shop selectors, rewards, Kenny's season, and
trainer bridges. The feature extraction is ongoing; see [roadmap.md](roadmap.md).

| Area | Current owner | Data boundary |
| --- | --- | --- |
| Shell and navigation | `src/app/app.ts`, `app.html` | `View` / `shopTab` are local UI state |
| Dino Designer | `features/dinoverse/dino-designer/` | Inputs are current skin, level, availability and choices; outputs request navigation or a skin selection |
| Kenny season | `dino-season.ts` and orchestration in `app.ts` | `profile.dinoSeasons['kenny-2026']`; keep saved IDs and odds stable |
| Shop and inventory | `shop-items.ts`, `legacy-owned-items.ts`, selectors in `app.ts` | Stored inventory is an array of unchanged item IDs |
| Cosmetics imagery | `cosmetic-assets.ts`, `cosmetic-icon.component.ts`, `cosmetic-art.component.ts` | Pure display mapping; no migration of stored values |
| Authentication and cloud | `cloud.ts`, orchestration in `app.ts` | Existing Firebase Auth/Firestore documents and local backup format |
| Trainers and achievements | `trainer-registry.ts`, trainer bridges in `app.ts` | Per-verse saves, claimed rewards and XP |
| Standalone learning worlds | `public/nawi`, `public/dsai`, `public/pos`, `public/daily`, `public/kennyverse` | Shared profile bridge and trainer save keys |

The Dino Designer is a presentation component: its events call the existing
parent methods. `setKennySkin` still checks ownership and saves through the
existing path. Its portrait helper only chooses an image URL; sprite animation
and reward odds remain in the existing code.

## State and compatibility

`app.ts` loads `studyverse_profile_v1`, upgrades legacy saves, hydrates the
cloud snapshot, and serializes the same `Profile` shape. `cloud.ts` handles
Firebase requests and public friend cards. `trainer-registry.ts` identifies
learning worlds and save keys. During extraction, preserve the order of cloud
hydration, bridge consumption, local writes and queued remote saves. Do not
change Firebase rules or profile serialization as part of presentation work.

New shop items go into `shop-items.ts` with the existing ID and requirement
conventions. New Kenny skins require separate `kenny_skin_*` and
`kenny_avatar_*` IDs plus their own portrait and idle/feed sprite assets. New
learning worlds require a trainer registry entry and deployable `public/` path.

## Styles and generated CSS

The checked-in source has about 2,125 lines in `src/styles.scss` and 630 lines
in `src/app/app.scss` at the start of this refactor. Angular emits a minified,
one-line `styles-*.css` bundle of about 168 KB. Large DevTools line counts or
very long displayed lines are generated output, not another handwritten CSS
source. The real debt is the source cascade: global selectors, repeated
responsive overrides and feature rules dispersed across `styles.scss`.

The designer stylesheet currently contains only host layout. Its established
global selectors stay in place for the first extraction so selector scope and
order remain identical. Moving those rules and introducing design tokens are
separate visual-regression-checked steps. Global theme selectors, animation
keyframes and CSS affecting the shell must remain shared where appropriate.

## Local verification and release

Use `npm ci` for a fresh checkout, then `npm test -- --watch=false` and
`npm run build -- --base-href /studyverse/ --output-path dist/site`.
The static regression scripts in `scripts/` cover economy, saves, profiles,
learning worlds and Kenny. `node scripts/test-mobile-layout.cjs` uses a real
browser at 320, 390, 768 and desktop widths (install its Playwright driver
when needed). GitHub Actions runs these checks for the PR; only merge after
they pass. A push to `main` runs `.github/workflows/deploy.yml`, builds with
`/studyverse/`, injects the Firebase web config into the Pages artifact,
checks mobile layouts again, and publishes GitHub Pages. Verify that run and
the live page before starting the next extraction.
