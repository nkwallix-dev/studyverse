import { FIELD } from './kenny-platformer.balance';
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const centre = (r: Rect) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export function distanceInFields(a: Rect, b: Rect): number {
  const p = centre(a),
    q = centre(b);
  return Math.hypot(p.x - q.x, p.y - q.y) / FIELD;
}
/** Logical directional band, measured from body edges, not opaque sprite pixels. */
export function reaches(a: Rect, b: Rect, range: number, facing: number, aim = 0): boolean {
  const p = centre(a),
    q = centre(b),
    dx = q.x - p.x,
    dy = q.y - p.y;
  const horizontal = Math.max(0, Math.abs(dx) - (a.w + b.w) / 2);
  const vertical = Math.max(0, Math.abs(dy) - (a.h + b.h) / 2);
  return aim === 0
    ? dx * facing >= -FIELD * 0.25 && horizontal <= range * FIELD && vertical <= FIELD * 0.6
    : dy * aim >= -FIELD * 0.25 && vertical <= range * FIELD && horizontal <= FIELD * 0.6;
}
