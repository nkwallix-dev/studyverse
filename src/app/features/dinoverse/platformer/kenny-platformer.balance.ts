/** Every gameplay distance uses world fields; rendering never feeds values back. */
export const FIELD = 50;
export const BALANCE = {
  gravity: 34 * FIELD,
  player: {
    speed: 5.6,
    jumpVelocity: 13,
    jumpCutoff: 5.2,
    groundAcceleration: 48,
    airAcceleration: 32,
    jumpBuffer: 0.12,
    coyote: 0.1,
    respawnInvulnerability: 1.5,
  },
  health: 3,
  bite: { range: 1, damage: 1, cooldown: 0.5, duration: 0.22 },
  leap: {
    range: 3,
    travel: 3,
    damage: 2,
    cooldown: 3,
    windup: 0.08,
    active: 0.3,
    recovery: 0.12,
    pogo: 2,
  },
  tail: { range: 3, damage: 3, cooldown: 2.5, duration: 0.8, dotDamage: 0.25, dotSeconds: 4 },
  charge: { range: 4, travel: 4, damage: 2, cooldown: 4, windup: 2, active: 0.4, recovery: 0.2 },
  shield: { frill: 2, plates: 1, regeneration: 8 },
  specialStun: 1,
  triceratopsStun: 3,
  stegoBleed: { duration: 4, tick: 1, damage: 0.25 },
  enemyPursuit: { levelTolerance: 0.8, separation: 0.4 },
  amber: { basic: [1, 2], medium: [2, 4], elite: [6, 6] } as const,
  enemy: {
    sight: 5,
    disengage: 20,
    health: { basic: 2, medium: 4, elite: 7 },
    patrolSpeed: 1.3,
    chaseSpeed: 2.5,
    contactDamage: 1,
    invulnerability: 1.3,
    stegoCooldown: 1.9,
    triceratopsCooldown: 4,
  },
  pickup: { range: 1.25 },
} as const;
export type SpecialKind = 'leap' | 'charge' | 'tail';
export const specialDuration = (kind: SpecialKind): number =>
  kind === 'tail'
    ? BALANCE.tail.duration
    : BALANCE[kind].windup + BALANCE[kind].active + BALANCE[kind].recovery;
