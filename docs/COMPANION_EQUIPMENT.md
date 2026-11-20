# Hornweide: companion equipment

Entry: Studyverse → Begleiter → Begleiter-Inventar / Begleiter-Achievements / Spielen.
Four definitions live in `features/dinoverse/equipment/companion-equipment.model.ts`.
Items stay separate from global cosmetics; no XP or TastyTokens are granted.

## Progress and cloud

`profile.companions` version 1 stores an append-only map of unique pickup IDs to
item IDs, an equipment choice with a logical timestamp, and acknowledged rewards.
Counts, unlocked equipment and completed achievements are derived from the ledger:
50 pickups of that item unlock it permanently, without spending the count.
This avoids inconsistent duplicated counters/unlock flags. Old profiles default to empty.
Each run has a random UUID; an enemy/drop index makes each pickup unique within it.
Only collision with an uncollected drop emits the event. Dead enemies never emit twice.
Runs are not resumed after reload; drops from previous runs cannot be replayed.

Cloud writes merge pickup and acknowledgement sets, use Firestore document-update
preconditions and retry collisions. Companion-only writes preserve all other current
cloud fields. Ordinary profile writes preserve remote companion progress as well.
Equipment uses latest logical timestamp; an explicit removal is also timestamped.
No Firebase rules changes are required: everything uses the existing owner-only
profile envelope. As with existing client progress, this is not server anti-cheat.
Old *deployed* clients predating this implementation cannot perform the new merge;
avoid running old versions when collecting. The existing 700 KB snapshot guard
also bounds the ledger; compaction would require a future coordinated migration.

## Run integration

The start item is copied once into a fresh world's fusion set. Drops add temporary
abilities to that set and never modify the saved equipment selection. Checkpoints
preserve run fusion; starting another run clears it and reloads the start item.
Basic / medium / elite enemies have 2 / 4 / 7 health and drop zero / one random /
both species items. J attacks repeatedly with a cooldown. Horns deal 2 damage;
frill blocks frontal contact; plates block rear contact; spikes also reach behind
Kenny and apply 0.25 damage/second over four seconds (refresh, no stacking).

## Assets

`public/kenny/hornweide/{triceratops-horns,triceratops-frill,stegosaurus-plates,stegosaurus-spikes}.svg`
are explicitly labelled neutral placeholders, not recoloured final art. Replace
`asset` metadata and the card URL together when supplied PNGs arrive.
Enemy sprites can replace the existing renderer's schematic drawings. No filters
or fake body-part overlays are added. Active fusion names are shown in the HUD;
actual fused Kenny animation sheets remain a separate asset integration.

## Verification

`node scripts/test-companion-equipment.cjs` covers 49/50/51, equip/remove, drop tiers,
real pickup-only events, collision dedupe, serialization and concurrent-device unions.
The existing world solver still completes the full course through normal controls.
The browser suite adds inventory/achievement unlock, equip, start ability, unchanged
wallet and layout checks at 320, 390, 768 and 1280 pixels. Both deploy and PR CI run it.
