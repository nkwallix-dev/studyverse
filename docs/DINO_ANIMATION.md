# Kenny movement and dinosaur animations

## Runtime PNGs

`public/kenny/animations/` contains transparent PNG strips for five Kenny skins
(blue, green, red, pink, zebra), Triceratops walk, Stegosaurus walk/tail attack,
and standalone enemy PNGs. `manifest.json` records source image names and layout.
Each strip has four 192×192 cells; the foot baseline is at y=180. Shared per-species
scaling preserves body size across poses. Leftward motion mirrors the right-facing
art. Stegosaurus attack frames already contain its turn; mirror by attack target,
not its changing facing. The PNGs can be reused independently of this course.

The existing four-frame idle strips and the companion feeding animation are
unchanged. A grounded, stationary Kenny uses the original idle strip. Moving uses
the new walk strip; airborne Kenny uses takeoff/landing poses; J plays its own
anticipation, leap, impact and recovery sequence. World simulation time drives
frames so pausing also pauses the action. All animation PNGs preload before Start.

## Controls and combat

A/D move and face Kenny. Space jumps. W/S (or up/down) aim without changing Kenny's
collision dimensions. Touch provides separate aim, movement, jump and attack keys.
J latches facing/aim for 0.5 seconds: 0.08 seconds anticipation, 0.30 seconds travel,
then recovery. A clear horizontal attack travels 150 world units. Walls stop it;
A/D and Space cannot steer, turn or replace the active attack. Cooldown is 0.78 s.
Up aim gives an upward leap, down aim dives when airborne or makes a low hop from
the ground. The reticle shows the selected target direction.

Each enemy can receive damage once per committed strike. Equipped horns increase
that damage; tail-spike fusion still applies its damage-over-time effect. Enemy
kills retain the existing drop/pickup interface. No wallet or achievement changes.
The previous shrinking tunnel now has enough headroom for Kenny's full height.

Stegosaurus telegraphs an attack nearby, turns, and performs one tail sweep. Its
0.8-second sequence only damages in the visible strike window and only once.
It then returns to patrol, with a 1.9-second cooldown measured from windup start.

## Asset prompts and provenance

Assets were generated from the repository's actual blue Kenny portrait, preserving
its head, stripes, colours and proportions. The master brief specified a 4×2
transparent atlas: four alternating leg-stride frames above, and anticipation /
takeoff / forward impact / landing below. Skin variants used the same atlas plus
the existing matching skin portrait and requested palette changes only.
Triceratops uses the same black-outlined cartoon style, four legs, an orange frill
and ivory horns, in a 2×2 four-frame walk cycle. Stegosaurus uses a green body,
amber back plates and a four-spiked tail, with a 4×2 walk / turn-and-tail-sweep atlas.
No scene, text, baked checkerboard or ground shadows were requested. Runtime
packing only trims transparent padding, scales and aligns cells; it does not
invent motion, paint body parts or recolour generated artwork.

## Checks

The world solver completes Hornweide through public controls. Tests cover constant
lunge distance despite opposite held movement, aim latching, full-size W/S aiming,
air jump prevention, one hit per attack, aimed target collision, Stegosaurus turn
and tail damage, idle/walk/air/attack animation selection, checkpoints and pickups.
Browser checks inspect real sprite selection, advancing leg frames, W/S without a
jump or shrink, locked attack direction, 150-unit travel and return to original
idle art, plus the full course and touch controls at multiple viewport sizes.
