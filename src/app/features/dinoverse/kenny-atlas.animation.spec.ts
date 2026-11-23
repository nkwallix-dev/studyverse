import { describe, expect, it } from 'vitest';
import {
  atlasCellForMotion,
  feedAtlasCell,
  idleAtlasFrame,
  normalizedAtlasSkin,
} from './kenny-atlas.animation';

describe('Kenny 30 FPS atlas mapping', () => {
  it('keeps the rat outside the first twelve logical feed frames', () => {
    expect(feedAtlasCell(0)).toEqual({ column: 0, row: 1 });
    expect(feedAtlasCell(11)).toEqual({ column: 2, row: 1 });
    expect(feedAtlasCell(12)).toEqual({ column: 3, row: 1 });
  });

  it('maps all normal motions to their authored rows', () => {
    expect(atlasCellForMotion('idle', 8)).toEqual({ column: 8, row: 0 });
    expect(atlasCellForMotion('attack', 4)).toEqual({ column: 4, row: 2 });
    expect(atlasCellForMotion('jump', 7)).toEqual({ column: 7, row: 4 });
    expect(atlasCellForMotion('walk', 3)).toEqual({ column: 3, row: 5 });
  });

  it('keeps the saved zebra id compatible while presenting the white atlas', () => {
    expect(normalizedAtlasSkin('zebra')).toBe('white');
    expect(normalizedAtlasSkin('pink')).toBe('pink');
    expect(normalizedAtlasSkin('unknown')).toBe('blue');
  });

  it('runs the idle flourish at 30 FPS without looping it hyper-fast', () => {
    expect(idleAtlasFrame(2.69)).toBe(0);
    expect(idleAtlasFrame(2.7)).toBe(0);
    expect(idleAtlasFrame(2.999)).toBe(8);
    expect(idleAtlasFrame(3)).toBe(0);
  });
});
