import { describe, expect, it } from 'vitest';
import {
  KENNY_RIG_BONES,
  KENNY_RIG_FPS,
  kennyIdlePose,
  paletteForSkin,
  rigFrames,
} from './kenny-rig.model';
describe('Kenny master rig prototype', () => {
  it('has explicit joints and valid parent references', () => {
    const ids = KENNY_RIG_BONES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const bone of KENNY_RIG_BONES) if (bone.parent) expect(ids).toContain(bone.parent);
    expect(ids).toContain('lower-jaw');
    expect(ids).toContain('near-foot');
    expect(ids).toContain('tail-tip');
  });
  it('renders 10 FPS independently of world simulation', () => {
    expect(KENNY_RIG_FPS).toBe(10);
    expect(rigFrames).toHaveLength(64);
    expect(rigFrames[0]).toBe('frame-000.png');
    expect(rigFrames[63]).toBe('frame-063.png');
    expect(kennyIdlePose(64)).toEqual(kennyIdlePose(0));
  });
  it('has distinguishable skin palettes and preserves zebra alias', () => {
    expect(paletteForSkin('blue').body).not.toBe(paletteForSkin('pink').body);
    expect(paletteForSkin('zebra').stripes).toBe('#101019');
    expect(paletteForSkin('bad')).toEqual(paletteForSkin('blue'));
  });
  it('blinks, looks around and moves head/tail without changing root', () => {
    expect(kennyIdlePose(15).blink).toBeLessThan(1);
    expect(kennyIdlePose(45).head).not.toEqual(kennyIdlePose(0).head);
    expect(kennyIdlePose(12).tail).not.toEqual(kennyIdlePose(0).tail);
  });
});
