# SDD ledger — plan: docs/superpowers/plans/2026-11-22-kenny-30fps.md

Baseline: `npm test -- --watch=false` passed (1 file, 4 tests).
Pre-flight: Task 1 manifest contract -> Tasks 2/3 packing and palette generation: frame counts, FPS, cell geometry, and rat phases are the shared authority.
Pre-flight: Tasks 2/3 atlas outputs -> Task 4 runtime: runtime must consume the generated dimensions rather than hard-coded four-frame math.
Pre-flight: Task 4 skin paths -> Task 5 compatibility: persisted `zebra` stays stable while user-facing copy becomes White.
Ruling: “Standard” is the unskinned canonical master and Blue remains the default selectable/save-compatible skin — this preserves the current profile model while still shipping six appearances — if wrong, Standard would need a new selectable persistence value later.
Task 1: complete (commits 171cff9..e5511af, tests: node scripts/test-kenny-30fps-assets.cjs + npm test -- --watch=false → pass)
