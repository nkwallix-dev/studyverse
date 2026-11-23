export const KENNY_ATLAS_FPS = 30;
export const KENNY_ATLAS_COLUMNS = 9;
export const KENNY_ATLAS_ROWS = 6;

export type KennyAtlasMotion = 'idle' | 'walk' | 'jump' | 'attack';
export type KennyAtlasSkin = 'blue' | 'green' | 'red' | 'pink' | 'white';
export interface KennyAtlasCell {
  column: number;
  row: number;
}

const MOTION_ROWS: Record<KennyAtlasMotion, number> = {
  idle: 0,
  attack: 2,
  jump: 4,
  walk: 5,
};

const clampFrame = (frame: number, maximum: number): number =>
  Math.max(0, Math.min(maximum, Math.floor(Number.isFinite(frame) ? frame : 0)));

export function frameAt30Fps(elapsedSeconds: number, frames = KENNY_ATLAS_COLUMNS): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0 || frames < 1) return 0;
  return Math.floor(elapsedSeconds * KENNY_ATLAS_FPS) % Math.floor(frames);
}

export function idleAtlasFrame(elapsedSeconds: number): number {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return 0;
  const tick = Math.floor(elapsedSeconds * KENNY_ATLAS_FPS) % 90;
  return tick < 81 ? 0 : tick - 81;
}

export function atlasCellForMotion(motion: KennyAtlasMotion, frame: number): KennyAtlasCell {
  return {
    column: clampFrame(frame, KENNY_ATLAS_COLUMNS - 1),
    row: MOTION_ROWS[motion],
  };
}

/**
 * Maps the 96 logical frames of the 3.2 second feed to 30 authored cells.
 * Cells 0–2 in row one contain Kenny alone. The rat first exists in cell 3,
 * so it cannot pop into the opening frame.
 */
export function feedAtlasCell(logicalFrame: number): KennyAtlasCell {
  const frame = clampFrame(logicalFrame, 95);
  if (frame <= 11) return { column: Math.floor((frame * 3) / 12), row: 1 };
  if (frame <= 29) return { column: 3 + Math.floor(((frame - 12) * 6) / 18), row: 1 };
  if (frame <= 41) return { column: Math.floor(((frame - 30) * 3) / 12), row: 2 };
  if (frame <= 59) return { column: 3 + Math.floor(((frame - 42) * 6) / 18), row: 2 };
  if (frame <= 77) return { column: Math.floor(((frame - 60) * 6) / 18), row: 3 };
  return { column: 6 + Math.floor(((frame - 78) * 3) / 18), row: 3 };
}

export function atlasBackgroundPosition(cell: KennyAtlasCell): string {
  return `${(cell.column * 100) / (KENNY_ATLAS_COLUMNS - 1)}% ${(cell.row * 100) / (KENNY_ATLAS_ROWS - 1)}%`;
}

export function normalizedAtlasSkin(skin: string): KennyAtlasSkin {
  if (skin === 'zebra') return 'white';
  if (skin === 'green' || skin === 'red' || skin === 'pink' || skin === 'white') return skin;
  return 'blue';
}

export function atlasAsset(skin: string): string {
  return `kenny/atlases/kenny-${normalizedAtlasSkin(skin)}-30fps.png`;
}
