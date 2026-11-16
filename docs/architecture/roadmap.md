# Incremental refactoring roadmap

Baseline on `main` at `6cc087e` (before extraction): 3 standalone Angular
components, `app.ts` 1,395 lines, `app.html` 799 lines, `app.scss` 630 lines,
`styles.scss` 2,125 lines. Record the same measurements after each PR.

1. **Dino Designer presentation** — completed in PR #43; own template, typed
   inputs and output events. Save and season logic remain in the parent.
2. **Kenny rewards and pool** — completed in PR #44: overview and full-prize
   popup extracted as display components. Move their global CSS selectors in a separate review
   after responsive comparison. Preserve the five sprite strips,
   level gates, 0/0.5% Zebra odds and independent collection messages.
3. **Shop and inventory** — inventory view extracted first, with owned cards,
   filters, and equipment events still backed by existing parent logic. Extract
   catalog and preview in later independent PRs;
   centralize typed selectors and equipment actions without changing item IDs.
4. **Profile, friends and account flows** — extract public profile and editor
   views, then move cloud orchestration behind a narrow service interface.
   Keep local/cloud hydration and Firestore document shapes compatible.
5. **Dashboard, achievements and learning worlds** — extract remaining large
   page sections and bridge logic in independent PRs.
6. **Styles and domain boundaries** — remove proven dead overrides, move
   feature CSS in cascade-preserving batches, add shared design tokens, and
   separate pure economy/progression calculations from the shell.

For each step: compare the new branch with fresh `main`, run unit, static and
browser regressions, review screenshots and asset paths, merge only green PRs,
then verify the Pages deployment before branching from the new `main`.

Known technical debt: `app.ts` still owns state, Firebase orchestration and
multiple domain actions; `app.html` contains most other feature sections;
global CSS is order-sensitive. These are planned work, not fixed by step 1.

### Inventory extraction measurements

Compared with `6a60f53`. Sizes are UTF-8 bytes and line counts.

| Source | Before | After |
| --- | ---: | ---: |
| Angular components | 6 | 7 |
| `app.ts` | 82,151 bytes / 1,399 lines | 83,075 bytes / 1,436 lines |
| `app.html` | 77,990 bytes / 738 lines | 75,951 bytes / 717 lines |
| `app.scss` | 66,112 bytes / 630 lines | 64,641 bytes / 615 lines |
| `styles.scss` | 168,861 bytes / 2,125 lines | 168,861 bytes / 2,125 lines |

### Dino feature formatting measurements

Sizes are UTF-8 bytes and line counts across each component's TypeScript,
template and stylesheet. The Angular component count is 7 before and after.

| Component | Before | After |
| --- | ---: | ---: |
| Dino Designer | 4,736 bytes / 75 lines | 4,980 bytes / 156 lines |
| Kenny reward overview | 2,764 bytes / 41 lines | 2,826 bytes / 77 lines |
| Kenny pool dialog | 3,376 bytes / 53 lines | 3,717 bytes / 95 lines |
