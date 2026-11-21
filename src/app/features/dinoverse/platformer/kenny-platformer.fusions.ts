import { ItemId } from '../equipment/companion-equipment.model';
import { PlayerMotion } from './kenny-platformer.animation';

/**
 * Each approved Kenny color atlas is an 8×8 grid, with 8 frames per fusion.
 * Row order verified against the real 2026-11-21 files, not the old static
 * design portraits.
 *
 * 0 horns; 1 frill; 2 plates; 3 spikes;
 * 4 horns+frill; 5 horns+plates; 6 spikes+frill; 7 spikes+plates.
 */
export function fusionAtlasRow(
  offense: ItemId | null,
  defense: ItemId | null,
): number | null {
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

/** Columns: idle, 2 walk poses, leap, wind-up, open-mouth attack, crouch, tail/finish. */
export function fusionAtlasColumn(
  motion: PlayerMotion,
  frame: number,
  biteActive: boolean,
  stunActive: boolean,
): number {
  if (stunActive) return 6;
  if (biteActive) return frame === 3 ? 4 : 5;
  if (motion === 'idle') return 0;
  if (motion === 'walk') return [0, 1, 2, 1][Math.max(0, frame % 4)];
  if (motion === 'jump') return 3;
  return [4, 5, 7, 6][Math.max(0, frame % 4)];
}
