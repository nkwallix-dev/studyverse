import type { ItemId } from '../equipment/companion-equipment.model';
import type { KennyWorld } from './kenny-platformer.world';
import type { PlayerMotion } from './kenny-platformer.animation';

/**
 * The five official 8×8 atlases share exactly the same pose layout:
 * 0 horns; 1 frill; 2 plates; 3 tail spikes;
 * 4 horns + frill; 5 horns + plates; 6 spikes + frill; 7 spikes + plates.
 * Rows are whole illustrated Kennys: do not layer loose item PNGs over them.
 */
export function fusionRow(offense: ItemId | null, defense: ItemId | null): number | null {
  if (offense === 'triceratops-horns') {
    if (defense === 'triceratops-frill') return 4;
    if (defense === 'stegosaurus-plates') return 5;
    return 0;
  }
  if (offense === 'stegosaurus-spikes') {
    if (defense === 'triceratops-frill') return 6;
    if (defense === 'stegosaurus-plates') return 7;
    return 3;
  }
  if (defense === 'triceratops-frill') return 1;
  if (defense === 'stegosaurus-plates') return 2;
  return null;
}

/** Every row: columns 0–2 gait, 3 jump/upward pose, 4 charge start,
 * 5 open mouth, 6 crouch/bite down, 7 dash or tail swing.
 */
export function fusionColumn(world: KennyWorld, motion: PlayerMotion): number {
  if (world.biteTime > 0) return world.biteAim < 0 ? 3 : world.biteAim > 0 ? 6 : 5;
  if (world.attackTime > 0) {
    if (world.attackKind === 'tail') return 7;
    if (world.attackKind === 'charge') return world.player.vx !== 0 ? 7 : 4;
    return 3;
  }
  if (motion === 'jump') return world.player.vy < 0 ? 3 : 7;
  if (motion === 'walk') return [0, 1, 2, 1][Math.floor(world.elapsed * 9) % 4];
  return 0;
}

/** CSS background-position percentage for a single cell in an 8×8 sheet.
 * The percent denominator is 7, because background positioning measures
 * the remaining 7 cell widths after the viewport has been subtracted.
 */
export function atlasPosition(row: number, col: number): string {
  return `${((col * 100) / 7).toFixed(5)}% ${((row * 100) / 7).toFixed(5)}%`;
}
