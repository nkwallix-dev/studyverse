# SDD ledger — plan: docs/superpowers/plans/2026-11-22-kenny-30fps.md

Baseline: `npm test -- --watch=false` passed (1 file, 4 tests).
Pre-flight: Task 1 manifest contract -> Tasks 2/3 packing and palette generation: frame counts, FPS, cell geometry, and rat phases are the shared authority.
Pre-flight: Tasks 2/3 atlas outputs -> Task 4 runtime: runtime must consume the generated dimensions rather than hard-coded four-frame math.
Pre-flight: Task 4 skin paths -> Task 5 compatibility: persisted `zebra` stays stable while user-facing copy becomes White.
Ruling: “Standard” is the unskinned canonical master and Blue remains the default selectable/save-compatible skin — this preserves the current profile model while still shipping six appearances — if wrong, Standard would need a new selectable persistence value later.
Task 1: complete (commits 171cff9..e5511af, tests: node scripts/test-kenny-30fps-assets.cjs + npm test -- --watch=false → pass)

## Rescue status — 2026-11-23

- Existing worktree found at `.worktrees/kenny-30fps`; no existing changes were discarded.
- Rescue branch: `codex/kenny-30fps-rescue-20261123`
- Initial rescue commit: `9a36b9a` (`wip: rescue Kenny 30 FPS overhaul`)
- Pull request to `main`: <https://github.com/nkwallix-dev/studyverse/pull/66>
- No new graphics were generated during rescue or verification.

### Actually present and wired

- Five normalized 1728×1152, 9×6 atlases: Blue, Green, Red, Rose-Pink and White.
- White is loaded through the backwards-compatible saved skin id `zebra`; its public label is `Kenny Weiß` and its stripes are black.
- Idle, walk, attack and jump each select nine authored atlas cells at a shared 30 FPS clock.
- Feed maps 96 logical 30 FPS frames (3.2 seconds) across 30 authored cells in rows 1–3.
- The main Dino page and normal, non-fusion Kennyverse player use the normalized atlases. Existing fusion/directional rendering remains on its established canvas path.

### Verified after rescue

- `node scripts/test-kenny-30fps-assets.cjs`
- `npm test -- --watch=false` (2 files, 8 tests)
- `node scripts/test-dino-season.cjs`
- `node scripts/test-companion-equipment.cjs`
- `node scripts/test-stachelweide.cjs`
- `node scripts/test-kenny-platformer.cjs`
- `node scripts/test-kenny-fusions.cjs`
- `node scripts/test-mobile-layout.cjs` (320–768px)
- `node scripts/test-kenny-platformer-browser.cjs`
- `npm run build -- --base-href /studyverse/ --output-path dist/site`

### Open / deliberately not changed during rescue

- The rescued feed artwork contains a rat. The earlier requirement named a goat, so the current art does not meet that original requirement. This remains open; rescue did not regenerate or replace artwork.
- The global Prettier check reports pre-existing formatting differences in unrelated feature and regression files. Rescue only formatted the directly touched animation helpers instead of rewriting whole legacy files.
- Production builds pass but retain the existing bundle-size warnings for the initial bundle and `src/app/app.scss`.
- Automated checks validate geometry, timing, asset loading and mobile/browser integration; a final human frame-by-frame art review of every skin/action combination remains advisable.
