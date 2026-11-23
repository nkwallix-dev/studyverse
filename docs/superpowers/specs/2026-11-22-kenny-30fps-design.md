# Kenny 30 FPS Animation Design

## Intent

Replace Kenny's current low-frame animation strips with a consistent, game-ready 30 FPS animation set. The new set must feel fluid in both the season/designer presentation and the Kenny platformer while preserving Kenny's recognizable silhouette, proportions, golden eyes, black outlines, and existing collision behavior.

## Goals

- Ship aligned 30 FPS animation sequences for Standard, Blue, Green, Red, Rose-Pink, and White Kenny.
- Keep the internal `zebra` save/profile identifier for backwards compatibility, but render it as a white body with black stripes.
- Restore Pink as a clearly pink/rose palette rather than purple, with enough hue separation from Red.
- Replace the existing feeding action with a rat sequence: the rat starts outside the visible frame, visibly runs in frame-by-frame, Kenny notices it, catches it, eats it, and settles back to idle.
- Replace the existing weak normal-Kenny animation assets in place so current screens and saves continue to work.
- Preserve transparent backgrounds, stable foot baselines, and identical frame geometry across every palette.

## Non-goals

- Redesigning fusion equipment, enemy dinosaurs, physics, hitboxes, or controls.
- Renaming the persisted `zebra` identifier or migrating player saves.
- Adding gore; the rat action stays playful and cartoon-like.

## Constraints

- Playback is 30 FPS. Every runtime frame advances from elapsed simulation time, not from render refresh rate.
- All palette variants use the exact same pose sequence and registration.
- The rat is fully outside the visible crop at the start and enters continuously; no pop-in is permitted.
- White Kenny uses a white body and black stripes. Pink uses a rose-pink body, darker magenta stripes, and must not drift toward violet.
- Existing public paths remain stable where practical. New metadata declares frame count, cell size, baseline, playback rate, and action duration.
- Reduced-motion mode may freeze looping presentation animation, but explicit player-triggered feeding must remain understandable.

## Approaches

### Chosen: one master motion set, deterministic palette variants

Generate and clean one canonical transparent master sequence, pack it to fixed cells, then create Blue, Green, Red, Rose-Pink, and White variants from the same registered frames. This guarantees identical timing and prevents palette variants from changing anatomy or position.

### Rejected: independently generate every skin

Independent generations can look attractive but introduce pose drift, changing silhouettes, mismatched baselines, and frame-to-frame flicker.

### Rejected: interpolate the existing four-frame strips

Interpolation cannot repair the current coarse poses or create a convincing rat interaction; it tends to smear outlines and limbs.

## Animation Contract

- Idle loop: 48 frames at 30 FPS.
- Run loop: 12 frames at 30 FPS.
- Bite: 12 frames at 30 FPS.
- Jump/special: 18 frames at 30 FPS.
- Rat feeding: 96 frames at 30 FPS.
  - Frames 0-11: rat fully outside the visible crop.
  - Frames 12-29: rat runs into view from the right.
  - Frames 30-41: Kenny notices and tracks the rat.
  - Frames 42-59: catch/contact.
  - Frames 60-77: eat/swallow.
  - Frames 78-95: satisfied recovery back to idle.

## Tool Workflow

- tldraw records the state flow and exact rat sequence.
- Figma/FigJam records the atlas and palette pipeline.
- fal produces game-sprite source variants from the approved Kenny look.
- Adobe cleanup is used for background removal/crop cleanup when the generated source needs it.
- Repository scripts validate transparency, cell registration, palettes, and manifest data before runtime integration.

## Validation

- Static tests verify 30 FPS metadata, frame counts, dimensions, alpha, and palette rules.
- Runtime tests verify elapsed-time frame selection at 30 FPS and stable paths for all saved skins.
- Browser checks verify asset loading, no sprite resizing, no rat pop-in, and no regressions in mobile layouts.
- A production build must complete before the branch is pushed.
