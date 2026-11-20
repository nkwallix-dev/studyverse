# Stachelweide – Mechanics and balance

One field is 50 immutable world coordinates. Physics steps at 120 Hz; canvas size,
DPR, browser zoom and viewport only change rendering. Combat uses directional logical
body bands, never PNG alpha. Ranges below measure empty space from body edges;
vision and pickup distance measure centre to centre. Special ranges are capped at
the attack's starting position, so running during a special cannot extend its range.
Charge damage additionally requires reaching the target during the sprint (0.25-field
contact tolerance). Walls/platform edges can shorten committed travel.

## Controls and player attacks

| Input / ability | Damage (hearts) | Range (fields) | Travel (fields) | Cooldown | Timing |
| --- | --- | --- | --- | --- | --- |
| J – bite, always available | 1 | 1 | 0 | 0.5 s | 0.22 s animation, immediate single hit |
| L – leap, no offensive item | 2 | 3 | 3 forward | 3 s | 0.08 s anticipation + 0.30 s movement + 0.12 s recovery |
| L – Stegosaurus spikes | 3 + 0.25/s × 4 s = 4 total | 3 | 0 | 2.5 s | 0.8 s animation; hits during 0.40–0.68 s; DOT refreshes, never stacks |
| L – Triceratops horns | 2 | 4 | 4 forward | 4 s | 2 s preparation + 0.4 s sprint + 0.2 s recovery |
| Space – ordinary jump | 0 | — | Up to 2.49 vertically | — | Variable height when released early |
| Downward leap on enemy | Leap damage above | 3 | 2 upward after hit | Same leap cooldown | Once per leap; explicit S or automatically when directly above an enemy |

A/D move, W/S aim without shrinking or jumping, E collects the nearest Dino drop.
L snapshots facing/aim and locks A/D and ordinary jumping for its duration. J is
blocked during an active L animation; J and L have separate cooldowns. Cooldowns
start at activation, persist through checkpoint resets, and pause with the game.
Attack sprites/timelines reuse the existing Kenny and Dino artwork. Idle art stays
unchanged; final fusion artwork is a separate asset task.

## Health and shields

| Property | Value / behavior |
| --- | --- |
| Kenny base health | 3 hearts; restored at checkpoint |
| Basic / medium / elite enemy health | 2 / 4 / 7 |
| Damage immunity after accepted hit | 1.3 s |
| Checkpoint immunity | 1.5 s |
| Defensive priority | Shield absorbs first; remaining damage reaches base health |
| Triceratops frill | 2 shield hearts, no regeneration; removes run defense/fusion at zero |
| Stegosaurus plates | 1 shield heart; fully regenerates after 8 s without accepted damage |
| Regeneration reset | Every accepted hit, including shield-only damage, resets the 8 s timer |
| Checkpoint behavior | Keeps remaining shields, offense and unconsumed defense; never refills a consumed frill |
| Fresh frill pickup | Grants a new frill; losing an earlier frill never erases achievement receipts |

## Equipment and pickup economy

| System | Value / behavior |
| --- | --- |
| Simultaneous items | One offensive slot + one defensive slot |
| Horns / spikes | Replace only offensive L ability |
| Frill / plates | Replace only defensive item and refill its shield |
| Dino pickup | E, nearest uncollected drop within 1.25 fields; one per key press |
| Permanent inventory unlock | 50 pickups of the same item; inventory shows owned items only |
| Achievement progress | Counts successful E pickups; retained after item loss, death and reload |
| Basic enemy drops | None |
| Medium enemy drops | One species item, 50% offense / 50% defense |
| Elite enemy drops | Both species items |
| Bernstein | Automatic pickup, 23 per fresh run, separate persistent total in Kennyverse header |
| TastyTokens / XP | No rewards or conversion from this game |

Run pickups do not overwrite the saved start loadout. A fresh run reloads both saved
slots. Older one-slot saves migrate into the correct slot; pickup/amber receipts
merge idempotently and the two slot choices resolve independently by timestamp.
Companion-only cloud writes preserve the latest wallet, XP and trainer progress.
The append-only receipts share the existing 700 KB snapshot limit; no new backend
or anti-cheat mechanism is introduced.

## Enemies and movement

| Enemy mechanic | Range / distance | Damage | Cooldown / timing |
| --- | --- | --- | --- |
| Triceratops body contact | Logical body contact | 1 | 1.3 s player immunity |
| Triceratops charge | 4-field sprint | 2 on contact during sprint | 4 s from start; 2 s announced preparation, 0.4 s sprint, 0.2 s recovery |
| Stegosaurus body contact | Logical body contact | 1 | 1.3 s player immunity |
| Stegosaurus tail | 3 fields | 3 | 1.9 s from start; 0.8 s animation, hit window 0.40–0.68 s |
| Initial vision | 5 fields, front half-plane | — | Acquires only in facing direction |
| Pursuit retention | Up to 20 fields | — | Continues behind its current facing; returns to patrol above 20 |
| Patrol speed | 1.3 fields/s | — | Own existing route |
| Chase speed | 2.5 fields/s | — | Stops at pits, solid walls and closed gates |
| Kenny running speed | 5.6 fields/s | — | Acceleration 48 grounded / 32 airborne fields/s² |
| Gravity / ordinary jump speed | 34 fields/s² / 13 fields/s upward | — | 0.12 s input buffer, 0.1 s coyote time |
| Stegosaurus visual size | 190 high × 224 wide vs Kenny's 75–77 high | — | Fixed world size on all screens |

All game messages, HUD, shield/ability labels, E prompts and floating “−1 ❤️”
texts are overlays. Their contents never participate in sizing the canvas/sprite.
The existing platform geometry, gates, runes, checkpoints and Bernstein positions
are unchanged. The entire level is called Stachelweide.

## Verification

`test-stachelweide.cjs` tests controls, exact logical distances, pogo, dual slots,
legacy migration/merges, shield depletion, regeneration, timer reset, E pickup,
Bernstein deduplication, front-facing sight, pursuit/return, charge timing/damage,
tail DOT and pit boundaries. `test-companion-equipment.cjs` additionally mocks a
concurrent Firestore conflict and verifies unrelated account fields are preserved.
The world solver completes the full unchanged course through ordinary controls.
Browser CI replays that course through DOM keyboard events, checks bite vs special,
movement locks and sprite baselines, verifies both slots and empty inventory, and
checks desktop/mobile HUD/controls at 320, 390, 768, 844 and 1280 pixels.
