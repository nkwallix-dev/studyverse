import {
  ItemId,
  DinoSpecies,
  EquipmentSlots,
  itemSlot,
  dropsFor,
} from '../equipment/companion-equipment.model';
import { BALANCE, FIELD, SpecialKind, specialDuration } from './kenny-platformer.balance';
import { Rect, centre, distanceInFields, reaches } from './kenny-platformer.combat';
export type { Rect } from './kenny-platformer.combat';
export interface Controls {
  axis: number;
  aim: number;
  jump: boolean;
  jumpHeld: boolean;
  attack: boolean;
  special?: boolean;
  interact?: boolean;
}
export interface Platform extends Rect {
  origin?: number;
  travel?: number;
  period?: number;
  previousX?: number;
  oneWay?: boolean;
}
export interface Enemy extends Rect {
  min: number;
  max: number;
  direction: number;
  armored: boolean;
  alive: boolean;
  stun: number;
  species: DinoSpecies;
  tier: 'basic' | 'medium' | 'elite';
  health: number;
  poison: number;
  poisonTick: number;
  attackTime: number;
  attackCooldown: number;
  attackFacing: number;
  tailHit: boolean;
  attackLaunched: boolean;
  alerted: boolean;
  returning: boolean;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
}
export interface DamageText {
  id: number;
  x: number;
  y: number;
  amount: number;
  shield: boolean;
  life: number;
}
export const WORLD_WIDTH = 5300,
  EXPEDITION_WIDTH = 10300,
  WORLD_HEIGHT = 540,
  STEP = 1 / 120;
export const ATTACK_DURATION = specialDuration('leap'),
  ATTACK_WINDUP = BALANCE.leap.windup;
export const ATTACK_TRAVEL_TIME = BALANCE.leap.active,
  ATTACK_DISTANCE = BALANCE.leap.travel * FIELD;
export const STEGO_ATTACK_DURATION = BALANCE.tail.duration;
export const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const floor = (x: number, w: number): Platform => ({ x, y: 450, w, h: 90 });
const ledge = (x: number, y: number, w: number, oneWay = false): Platform => ({
  x,
  y,
  w,
  h: 22,
  oneWay,
});
const ferry = (x: number, y: number, travel: number, period: number): Platform => ({
  ...ledge(x, y, 112),
  origin: x,
  previousX: x,
  travel,
  period,
});
export class KennyWorld {
  readonly platforms: Platform[] = [
    floor(0, 520),
    floor(650, 1890),
    floor(3540, 1760),
    ledge(280, 360, 145),
    ledge(470, 240, 110),
    ledge(850, 355, 140),
    { x: 1260, y: 245, w: 380, h: 110 },
    ledge(2750, 410, 100),
    ledge(3060, 365, 100),
    ledge(3370, 405, 120),
    ferry(2600, 390, 100, 4.8),
    ferry(2915, 330, 95, 5),
    ferry(3210, 330, 85, 4.2),
    ledge(4100, 365, 120),
    ledge(4270, 280, 160),
    ledge(4580, 355, 180),
  ];
  readonly hazards: Rect[] = [
    { x: 520, y: 475, w: 130, h: 65 },
    { x: 2080, y: 433, w: 110, h: 17 },
    { x: 2540, y: 475, w: 1000, h: 65 },
  ];
  readonly gates: Rect[] = [
    { x: 1840, y: 140, w: 30, h: 310 },
    { x: 4980, y: 80, w: 30, h: 370 },
  ];
  readonly checkpoints = [90, 1060, 2320, 3690];
  readonly runes = [
    { x: 4000, y: 414, label: 'MOND' },
    { x: 4370, y: 244, label: 'FARN' },
    { x: 4670, y: 319, label: 'SONNE' },
  ];
  readonly amber = [
    [320, 325],
    [380, 325],
    [510, 205],
    [585, 325],
    [715, 410],
    [895, 320],
    [955, 320],
    [1160, 410],
    [1350, 433],
    [1490, 433],
    [1610, 433],
    [1760, 410],
    [2135, 330],
    [2400, 410],
    [2785, 375],
    [3095, 330],
    [3410, 370],
    [3730, 410],
    [4150, 330],
    [4320, 245],
    [4620, 320],
    [4720, 320],
    [5070, 410],
  ].map(([x, y]) => ({ x, y, collected: false }));
  readonly enemies: Enemy[] = [
    this.enemy(775, 700, 1010, false),
    this.enemy(1990, 1930, 2045, false),
    this.enemy(4480, 4450, 4540, true),
  ];
  /** Only real expeditions use procedural encounters; the legacy solver keeps its fixed fixtures. */
  readonly hardcore: boolean;
  readonly width: number;
  get switchX(): number {
    return this.hardcore ? 4440 : 1734;
  }
  get exitX(): number {
    return this.hardcore ? 10115 : 5142;
  }
  dead = false;
  readonly runId = crypto.randomUUID();
  readonly loot: (Rect & { id: string; item: ItemId; collected: boolean })[] = [];
  readonly enemyAmberDrops: (Rect & { id: string; collected: boolean })[] = [];
  readonly pickupEvents: { id: string; item: ItemId }[] = [];
  readonly amberEvents: string[] = [];
  readonly fusions = new Set<ItemId>();
  readonly damageTexts: DamageText[] = [];
  player = { x: 90, y: 390, w: 34, h: 60, vx: 0, vy: 0, facing: 1 };
  grounded: Platform | undefined;
  elapsed = 0;
  checkpoint = 0;
  health: number = BALANCE.health;
  deaths = 0;
  amberCount = 0;
  switchOpen = false;
  runeProgress = 0;
  won = false;
  attackTime = 0;
  attackKind: SpecialKind = 'leap';
  attackAim = 0;
  attackFacing = 1;
  specialCooldown = 0;
  biteTime = 0;
  biteCooldown = 0;
  aim = 0;
  invulnerable = 0;
  playerStun = 0;
  bleedRemaining = 0;
  private bleedTick = 0;
  private readonly random: () => number;
  private readonly amberDay: string;
  offense: ItemId | null = null;
  defense: ItemId | null = null;
  shield = 0;
  sinceDamage = 0;
  get shieldMaximum(): number {
    return this.defense === 'triceratops-frill'
      ? BALANCE.shield.frill
      : this.defense === 'stegosaurus-plates'
        ? BALANCE.shield.plates
        : 0;
  }
  get nearbyDrop() {
    return this.loot
      .filter(
        (drop) => !drop.collected && distanceInFields(this.player, drop) <= BALANCE.pickup.range,
      )
      .sort((a, b) => distanceInFields(this.player, a) - distanceInFields(this.player, b))[0];
  }
  equipRun(item: ItemId): void {
    const slot = itemSlot(item),
      previous = this[slot];
    if (previous) this.fusions.delete(previous);
    this[slot] = item;
    this.fusions.add(item);
    if (slot === 'defense') {
      this.shield = this.shieldMaximum;
      this.sinceDamage = 0;
    }
  }
  private attackOrigin: Rect = { x: 90, y: 390, w: 34, h: 60 };
  private attackLaunched = false;
  private pogoUsed = false;
  private pogoRising = false;
  private attackHits = new Set<Enemy>();
  private activatedRunes = new Set<number>();
  private jumpBuffer = 0;
  private coyote = 0;
  private damageId = 0;
  message = 'A/D laufen · Space springen · J beißen · L Spezialangriff · E aufheben';
  private messageTime = 0;
  constructor(
    startItem: ItemId | Partial<EquipmentSlots> | null = null,
    options: {
      expedition?: boolean;
      random?: () => number;
      amberDay?: string;
      claimedAmber?: Record<string, true>;
    } = {},
  ) {
    this.hardcore = options.expedition === true;
    this.width = this.hardcore ? EXPEDITION_WIDTH : WORLD_WIDTH;
    this.random = options.random || Math.random;
    this.amberDay = options.amberDay || new Date().toISOString().slice(0, 10);
    // Account-scoped receipts make each map crystal collectible once per calendar day,
    // including after retry, reload, or logging in on another device.
    if (this.hardcore) {
      this.addExplorationRoutes();
      this.enemies.splice(0, this.enemies.length, ...this.rollExpeditionEnemies(this.random));
    }
    this.amber.forEach((amber, i) => {
      amber.collected = options.claimedAmber?.[this.mapAmberId(i)] === true;
    });
    if (typeof startItem === 'string') this.equipRun(startItem);
    else if (startItem) {
      if (startItem.offense) this.equipRun(startItem.offense);
      if (startItem.defense) this.equipRun(startItem.defense);
    }
    this.grounded = this.platforms[0];
  }
  get progress(): number {
    return Math.min(100, Math.round((this.player.x / (this.exitX - 22)) * 100));
  }
  get hint(): string {
    if (this.messageTime > 0) return this.message;
    if (this.player.x >= this.runes[0].x - 300 && this.runeProgress < 3)
      return `Runen: MOND → FARN → SONNE. Nächste: ${this.runes[this.runeProgress].label} mit J.`;
    return this.runeProgress === 3 ? 'Das Tor ist offen. Erreiche das Portal!' : '';
  }
  get specialKind(): SpecialKind {
    return this.offense === 'triceratops-horns'
      ? 'charge'
      : this.offense === 'stegosaurus-spikes'
        ? 'tail'
        : 'leap';
  }
  /** Full run ends on death; checkpoint flags never revive an expedition. */
  private die(): void {
    if (this.dead) return;
    this.dead = true;
    this.deaths++;
    this.say('Kenny ist gefallen. Beim nächsten Versuch beginnt Stachelweide wieder von vorn.');
  }

  /** Daytime expedition: eight broad regions with jumpable 120px gullies.
   * Every elevated branch has stepping stones <= 95px apart vertically.
   * Semisolid ledges permit Kenny to jump through from below.
   */
  private addExplorationRoutes(): void {
    this.platforms.splice(
      0,
      this.platforms.length,
      floor(0, 640),
      floor(760, 1110),
      floor(1990, 1380),
      floor(3490, 1140),
      floor(4760, 1380),
      floor(6270, 1400),
      floor(7790, 1440),
      floor(9350, 950),
      ledge(230, 365, 190, true),
      ledge(370, 275, 170, true),
      ledge(510, 185, 185, true),
      ledge(690, 275, 180, true),
      ledge(825, 365, 170, true),
      ledge(1140, 365, 220, true),
      ledge(1280, 270, 330, true),
      ledge(1530, 360, 240, true),
      ledge(2350, 365, 200, true),
      ledge(2490, 290, 350, true),
      ledge(2770, 375, 230, true),
      ledge(3920, 365, 220, true),
      ledge(4040, 300, 380, true),
      ledge(4300, 375, 260, true),
      ledge(5170, 365, 200, true),
      ledge(5340, 285, 340, true),
      ledge(5650, 375, 210, true),
      ledge(6640, 365, 200, true),
      ledge(6740, 310, 410, true),
      ledge(7060, 380, 200, true),
      ledge(8150, 365, 200, true),
      ledge(8330, 275, 400, true),
      ledge(8680, 365, 200, true),
      ledge(9220, 365, 160, true),
      ledge(9350, 350, 270, true),
      ledge(9710, 360, 220, true),
    );
    this.hazards.splice(
      0,
      this.hazards.length,
      ...[
        [640, 120],
        [1870, 120],
        [3370, 120],
        [4630, 130],
        [6140, 130],
        [7670, 120],
        [9230, 120],
      ].map(([x, w]) => ({ x, y: 470, w, h: 70 })),
      // Short, telegraphed spike patches with clear approach/landing space.
      { x: 3025, y: 432, w: 75, h: 18 },
      { x: 7260, y: 432, w: 74, h: 18 },
    );
    this.gates[0] = { x: 4580, y: 140, w: 30, h: 310 };
    this.gates[1] = { x: 9930, y: 80, w: 30, h: 370 };
    this.checkpoints.splice(0, this.checkpoints.length, 90, 2140, 4030, 6460, 8240);
    this.runes.splice(
      0,
      this.runes.length,
      { x: 9000, y: 410, label: 'MOND' },
      { x: 9480, y: 316, label: 'FARN' },
      { x: 9780, y: 411, label: 'SONNE' },
    );
    // Exactly 23 once-daily crystals at reachable floor/stepping-stone heights.
    this.amber.splice(
      0,
      this.amber.length,
      ...[
        [320, 325],
        [450, 235],
        [580, 145],
        [850, 325],
        [1210, 325],
        [1420, 230],
        [1670, 410],
        [2200, 410],
        [2540, 250],
        [2720, 250],
        [3160, 410],
        [3610, 410],
        [4110, 265],
        [4320, 265],
        [4890, 410],
        [5460, 245],
        [5820, 410],
        [6460, 410],
        [6890, 270],
        [7350, 410],
        [8040, 410],
        [8490, 235],
        [9460, 310],
      ].map(([x, y]) => ({ x, y, collected: false })),
    );
  }

  /** Independent species and tier RNG; 20 encounters spaced across 10.3kpx. */
  private rollExpeditionEnemies(random: () => number): Enemy[] {
    const slots = [
      [450, 450, 300, 590],
      [1050, 450, 900, 1260],
      [1460, 270, 1300, 1590],
      [1750, 450, 1610, 1840],
      [2240, 450, 2100, 2490],
      [2640, 290, 2500, 2820],
      [3190, 450, 3100, 3350],
      [3780, 450, 3610, 3940],
      [4220, 300, 4060, 4400],
      [4500, 450, 4380, 4580],
      [5010, 450, 4870, 5200],
      [5490, 285, 5360, 5660],
      [5850, 450, 5700, 6080],
      [6480, 450, 6350, 6690],
      [6920, 310, 6770, 7120],
      [7400, 450, 7330, 7630],
      [8000, 450, 7870, 8250],
      [8480, 275, 8360, 8710],
      [8960, 450, 8800, 9200],
      [9740, 450, 9590, 9910],
    ] as const;
    let hasElite = false;
    return slots.map(([baseX, feet, left, right]) => {
      const species: DinoSpecies = random() < 0.5 ? 'stegosaurus' : 'triceratops';
      const roll = random();
      let tier: Enemy['tier'] = 'basic';
      if (!hasElite && roll < 0.1) {
        tier = 'elite';
        hasElite = true;
      } else if (roll < (hasElite ? 0.35 / 0.9 : 0.45)) {
        tier = 'medium';
      }
      const stego = species === 'stegosaurus';
      const enemy = this.enemy(baseX, left, right, tier === 'elite');
      enemy.species = species;
      enemy.tier = tier;
      enemy.armored = tier === 'elite';
      enemy.health = BALANCE.enemy.health[tier];
      enemy.w = stego ? 140 : 84;
      enemy.h = stego ? 70 : 52;
      enemy.y = feet - enemy.h;
      enemy.min = left + 6;
      enemy.max = Math.max(enemy.min, right - enemy.w - 6);
      enemy.x = Math.max(enemy.min, Math.min(enemy.max, baseX + Math.floor((random() - 0.5) * 24)));
      enemy.originX = enemy.x;
      enemy.originY = enemy.y;
      enemy.direction = random() < 0.5 ? -1 : 1;
      return enemy;
    });
  }

  respawn(): void {
    this.player = {
      x: this.checkpoints[this.checkpoint],
      y: 390,
      w: 34,
      h: 60,
      vx: 0,
      vy: 0,
      facing: 1,
    };
    this.health = BALANCE.health;
    this.grounded = undefined;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.attackTime = 0;
    this.pogoRising = false;
    this.biteTime = 0;
    this.invulnerable = BALANCE.player.respawnInvulnerability;
    this.playerStun = 0;
    this.bleedRemaining = 0;
    this.bleedTick = 0;
    this.deaths++;
    this.say('Checkpoint erreicht. Bereits gezählte Pickups bleiben erhalten.');
  }
  step(dt: number, input: Controls): void {
    if (this.won || this.dead) return;
    dt = Math.min(STEP, Math.max(0, dt));
    this.elapsed += dt;
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.specialCooldown = Math.max(0, this.specialCooldown - dt);
    this.biteCooldown = Math.max(0, this.biteCooldown - dt);
    this.biteTime = Math.max(0, this.biteTime - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.playerStun = Math.max(0, this.playerStun - dt);
    // Bleeding applies four separate quarter-heart ticks, even during hit i-frames.
    // This preserves a meaningful escape window and never causes instant bonus damage.
    if (this.bleedRemaining > 0 && !this.dead) {
      this.bleedRemaining = Math.max(0, this.bleedRemaining - dt);
      this.bleedTick -= dt;
      if (this.bleedTick <= 1e-9) {
        this.applyBleedTick();
        this.bleedTick += BALANCE.stegoBleed.tick;
      }
    }
    for (const text of this.damageTexts) {
      text.life -= dt;
      text.y -= 28 * dt;
    }
    for (let i = this.damageTexts.length - 1; i >= 0; i--)
      if (this.damageTexts[i].life <= 0) this.damageTexts.splice(i, 1);
    this.sinceDamage += dt;
    if (
      this.defense === 'stegosaurus-plates' &&
      this.sinceDamage + 1e-9 >= BALANCE.shield.regeneration
    )
      this.shield = BALANCE.shield.plates;
    this.movePlatforms();
    const player = this.player;
    this.aim = Math.max(-1, Math.min(1, input.aim || 0));
    if (this.playerStun > 0) {
      input = {
        ...input,
        axis: 0,
        jump: false,
        jumpHeld: false,
        attack: false,
        special: false,
      };
      player.vx = 0;
    }
    if (input.special && this.attackTime <= 0 && this.specialCooldown === 0) {
      if (input.axis) player.facing = Math.sign(input.axis);
      this.attackKind = this.specialKind;
      this.attackTime = specialDuration(this.attackKind);
      this.specialCooldown = BALANCE[this.attackKind].cooldown;
      this.attackFacing = player.facing;
      this.attackOrigin = { ...player };
      this.attackAim =
        this.aim ||
        (this.attackKind === 'leap' &&
        this.enemies.some(
          (enemy) =>
            enemy.alive &&
            centre(player).y < enemy.y &&
            Math.abs(centre(player).x - centre(enemy).x) <= FIELD,
        )
          ? 1
          : 0);
      this.attackLaunched = false;
      this.pogoUsed = false;
      this.attackHits.clear();
      this.activatedRunes.clear();
    }
    if (this.attackTime > 0) {
      const kind = this.attackKind,
        elapsed = specialDuration(kind) - this.attackTime;
      const active =
        kind !== 'tail' &&
        elapsed + 1e-9 >= BALANCE[kind].windup &&
        elapsed < BALANCE[kind].windup + BALANCE[kind].active - 1e-9;
      player.facing =
        kind === 'tail' && elapsed >= BALANCE.tail.duration / 2
          ? -this.attackFacing
          : this.attackFacing;
      player.vx = active
        ? (this.attackFacing * BALANCE[kind as 'leap' | 'charge'].travel * FIELD) /
          BALANCE[kind as 'leap' | 'charge'].active
        : 0;
      if (active && !this.attackLaunched) {
        if (kind === 'leap') {
          player.vy =
            this.attackAim < 0 ? -520 : this.attackAim > 0 ? (this.grounded ? -200 : 250) : -340;
          this.grounded = undefined;
        }
        this.attackLaunched = true;
        this.jumpBuffer = 0;
        this.coyote = 0;
      }
    } else {
      this.jumpBuffer = input.jump ? BALANCE.player.jumpBuffer : Math.max(0, this.jumpBuffer - dt);
      this.coyote = this.grounded ? BALANCE.player.coyote : Math.max(0, this.coyote - dt);
      const target = Math.max(-1, Math.min(1, input.axis)) * BALANCE.player.speed * FIELD;
      const acceleration =
        (this.grounded ? BALANCE.player.groundAcceleration : BALANCE.player.airAcceleration) *
        FIELD *
        dt;
      player.vx += Math.max(-acceleration, Math.min(acceleration, target - player.vx));
      if (input.axis) player.facing = Math.sign(input.axis);
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        player.vy = -BALANCE.player.jumpVelocity * FIELD;
        this.grounded = undefined;
        this.coyote = 0;
        this.jumpBuffer = 0;
      }
      if (!this.pogoRising && !input.jumpHeld && player.vy < -BALANCE.player.jumpCutoff * FIELD)
        player.vy = -BALANCE.player.jumpCutoff * FIELD;
    }
    if (player.vy >= 0) this.pogoRising = false;
    player.vy += BALANCE.gravity * dt;
    this.movePlayer(dt);
    if (input.attack && this.biteCooldown === 0 && this.attackTime === 0) {
      this.biteTime = BALANCE.bite.duration;
      this.biteCooldown = BALANCE.bite.cooldown;
      this.activatedRunes.clear();
      this.interactWithRuins();
      for (const enemy of this.enemies)
        if (enemy.alive && reaches(player, enemy, BALANCE.bite.range, player.facing, this.aim))
          this.hitEnemy(enemy, BALANCE.bite.damage);
    }
    if (this.attackTime > 0) {
      const elapsed = specialDuration(this.attackKind) - this.attackTime;
      const active =
        this.attackKind === 'tail'
          ? elapsed >= 0.4 && elapsed < 0.68
          : elapsed + 1e-9 >= BALANCE[this.attackKind].windup &&
            elapsed < BALANCE[this.attackKind].windup + BALANCE[this.attackKind].active;
      if (active) this.specialStrike();
      this.attackTime = Math.max(0, this.attackTime - dt);
    }
    this.moveEnemies(dt);
    if (this.dead) return;
    const inHazard =
      this.hazards.some((hazard) => overlaps(player, hazard)) || player.y > WORLD_HEIGHT + 60;
    if (this.hardcore && inHazard) {
      this.die();
      return;
    }
    this.collect(input.interact === true);
    if (!this.hardcore && inHazard) this.respawn();
    if (this.runeProgress === 3 && this.player.x > this.exitX - 32) {
      this.won = true;
      this.say('Stachelweide gemeistert!');
    }
  }
  private enemy(x: number, min: number, max: number, armored: boolean): Enemy {
    const tier = armored ? 'elite' : x > 1000 ? 'medium' : 'basic';
    return {
      x,
      y: armored ? 380 : 398,
      w: armored ? 112 : 84,
      h: armored ? 70 : 52,
      min,
      max,
      direction: -1,
      armored,
      alive: true,
      stun: 0,
      species: armored ? 'stegosaurus' : 'triceratops',
      tier,
      health: BALANCE.enemy.health[tier],
      poison: 0,
      poisonTick: 0,
      attackTime: 0,
      attackCooldown: 0,
      attackFacing: -1,
      tailHit: false,
      attackLaunched: false,
      alerted: false,
      returning: false,
      vx: 0,
      vy: 0,
      originX: x,
      originY: armored ? 380 : 398,
    };
  }
  private say(message: string): void {
    this.message = message;
    this.messageTime = 3;
  }
  private interactWithRuins(): void {
    const mouth: Rect = {
      x: this.player.facing > 0 ? this.player.x + this.player.w - 4 : this.player.x - 51,
      y: this.player.y + 6,
      w: 55,
      h: this.player.h - 6,
    };
    if (!this.switchOpen && overlaps(mouth, { x: this.switchX - 12, y: 396, w: 24, h: 43 }))
      this.switchOpen = true;
    this.runes.forEach((rune, index) => {
      if (
        this.runeProgress === 3 ||
        this.activatedRunes.has(index) ||
        !overlaps(mouth, { x: rune.x - 13, y: rune.y - 17, w: 26, h: 34 })
      )
        return;
      this.activatedRunes.add(index);
      this.runeProgress = index === this.runeProgress ? this.runeProgress + 1 : index === 0 ? 1 : 0;
    });
  }
  private specialStrike(): void {
    const player = this.player;
    for (const enemy of this.enemies) {
      if (!enemy.alive || this.attackHits.has(enemy)) continue;
      const aim = this.attackKind === 'leap' ? this.attackAim : 0;
      if (
        !reaches(this.attackOrigin, enemy, BALANCE[this.attackKind].range, this.attackFacing, aim)
      )
        continue;
      if (this.attackKind === 'charge' && !reaches(player, enemy, 0.25, this.attackFacing))
        continue;
      this.attackHits.add(enemy);
      this.hitEnemy(enemy, BALANCE[this.attackKind].damage);
      enemy.stun = Math.max(enemy.stun, BALANCE.specialStun);
      // Successful specials must not cause unavoidable contact damage while overlapping.
      this.invulnerable = Math.max(this.invulnerable, BALANCE.specialStun);
      if (this.attackKind === 'tail' && enemy.alive) {
        enemy.poison = BALANCE.tail.dotSeconds;
        enemy.poisonTick = 1;
      }
      if (
        this.attackKind === 'leap' &&
        this.attackAim > 0 &&
        centre(player).y < centre(enemy).y &&
        !this.pogoUsed
      ) {
        player.vy = -Math.sqrt(2 * BALANCE.gravity * BALANCE.leap.pogo * FIELD);
        this.grounded = undefined;
        this.pogoUsed = true;
        this.pogoRising = true;
      }
    }
  }
  private hitEnemy(enemy: Enemy, amount: number): void {
    if (!enemy.alive) return;
    enemy.health = Math.max(0, enemy.health - amount);
    enemy.stun = Math.max(enemy.stun, 0.25);
    this.damageTexts.push({
      id: ++this.damageId,
      x: enemy.x + enemy.w / 2,
      y: enemy.y,
      amount,
      shield: false,
      life: 0.85,
    });
    if (enemy.health <= 0) this.defeat(enemy);
  }
  private defeat(enemy: Enemy): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    const [minAmber, maxAmber] = BALANCE.amber[enemy.tier];
    const amberCount = minAmber + Math.floor(this.random() * (maxAmber - minAmber + 1));
    for (let i = 0; i < amberCount; i++) {
      this.enemyAmberDrops.push({
        id: `${this.runId}_enemy_${this.enemies.indexOf(enemy)}_amber_${i}`,
        x: enemy.x + enemy.w / 2 + (i - (amberCount - 1) / 2) * 17 - 7,
        y: enemy.y + enemy.h - 18,
        w: 14,
        h: 14,
        collected: false,
      });
    }
    dropsFor(enemy.species, enemy.tier).forEach((item, drop) =>
      this.loot.push({
        id: `${this.runId}_${this.enemies.indexOf(enemy)}_${drop}`,
        item,
        x: enemy.x + drop * 28,
        y: enemy.y + enemy.h - 22,
        w: 22,
        h: 22,
        collected: false,
      }),
    );
  }
  private sameHuntingLevel(enemy: Enemy): boolean {
    const feetGap = Math.abs(this.player.y + this.player.h - enemy.y - enemy.h);
    return (
      feetGap <= BALANCE.enemyPursuit.levelTolerance * FIELD &&
      !this.solids().some(
        (solid) =>
          // Ignore enemy's own floor and semisolid ledges that merely overhang the lane.
          !('oneWay' in solid && (solid as Platform).oneWay) &&
          solid.y < Math.max(this.player.y + this.player.h, enemy.y + enemy.h) - 8 &&
          solid.y + solid.h > Math.min(this.player.y, enemy.y) + 8 &&
          solid.x < Math.max(centre(enemy).x, centre(this.player).x) &&
          solid.x + solid.w > Math.min(centre(enemy).x, centre(this.player).x) &&
          !overlaps(solid, enemy),
      )
    );
  }

  private enemyGravity(enemy: Enemy, dt: number): void {
    if (!this.hardcore || !enemy.alive) return;
    const previousFeet = enemy.y + enemy.h;
    const nextFeet = previousFeet + Math.max(0, enemy.vy) * dt + BALANCE.gravity * dt * dt;
    const support = this.platforms.find(
      (platform) =>
        enemy.x + enemy.w > platform.x + 5 &&
        enemy.x < platform.x + platform.w - 5 &&
        previousFeet <= platform.y + 5 &&
        nextFeet >= platform.y,
    );
    if (support && enemy.vy >= 0) {
      enemy.y = support.y - enemy.h;
      enemy.vy = 0;
    } else {
      enemy.vy += BALANCE.gravity * dt;
      enemy.y += enemy.vy * dt;
    }
    if (enemy.y > WORLD_HEIGHT + 70 || this.hazards.some((hazard) => overlaps(enemy, hazard))) {
      // No farmable drops when an enemy falls into molten rock.
      enemy.alive = false;
      enemy.alerted = false;
    }
  }

  private moveEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.poison > 0) {
        enemy.poisonTick -= dt;
        enemy.poison = Math.max(0, enemy.poison - dt);
        if (enemy.poisonTick <= 1e-9) {
          this.hitEnemy(enemy, BALANCE.tail.dotDamage);
          enemy.poisonTick += 1;
        }
        if (!enemy.alive) continue;
      }
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      const dx = centre(this.player).x - centre(enemy).x;
      const distance = distanceInFields(this.player, enemy);
      const sameLevel = this.sameHuntingLevel(enemy);
      if (enemy.alerted && (distance > BALANCE.enemy.disengage || !sameLevel)) {
        enemy.alerted = false;
        enemy.returning = true;
      }
      if (
        !enemy.alerted &&
        sameLevel &&
        distance <= BALANCE.enemy.sight &&
        dx * enemy.direction >= 0
      ) {
        enemy.alerted = true;
        enemy.returning = false;
      }
      let charging = false;
      if (enemy.stun > 0) {
        enemy.attackTime = 0;
        enemy.tailHit = false;
        this.enemyGravity(enemy, dt);
        continue;
      }
      if (enemy.attackTime > 0) {
        const kind = enemy.species === 'stegosaurus' ? 'tail' : 'charge';
        const elapsed = specialDuration(kind) - enemy.attackTime;
        enemy.direction =
          kind === 'tail' && elapsed >= 0.4 ? -enemy.attackFacing : enemy.attackFacing;
        if (
          kind === 'charge' &&
          elapsed + 1e-9 >= BALANCE.charge.windup &&
          elapsed < BALANCE.charge.windup + BALANCE.charge.active - 1e-9
        ) {
          charging = true;
          this.walkEnemy(
            enemy,
            ((enemy.attackFacing * BALANCE.charge.travel * FIELD) / BALANCE.charge.active) * dt,
            true,
          );
          if (!enemy.tailHit && overlaps(this.player, enemy)) {
            this.hurt(enemy, BALANCE.charge.damage, 'charge');
            enemy.tailHit = true;
          }
        }
        if (
          kind === 'tail' &&
          elapsed >= 0.4 &&
          elapsed < 0.68 &&
          !enemy.tailHit &&
          reaches(enemy, this.player, BALANCE.tail.range, enemy.attackFacing)
        ) {
          if (this.hurt(enemy, 1, 'tail')) {
            this.bleedRemaining = BALANCE.stegoBleed.duration;
            this.bleedTick = BALANCE.stegoBleed.tick;
          }
          enemy.tailHit = true;
        }
        enemy.attackTime = Math.max(0, enemy.attackTime - dt);
      } else {
        if (enemy.alerted) enemy.direction = dx >= 0 ? 1 : -1;
        else if (enemy.returning) {
          if (Math.abs(enemy.originX - enemy.x) < 3) enemy.returning = false;
          else enemy.direction = Math.sign(enemy.originX - enemy.x);
        } else if (enemy.x <= enemy.min || enemy.x >= enemy.max)
          enemy.direction = enemy.x <= enemy.min ? 1 : -1;
        const kind = enemy.species === 'stegosaurus' ? 'tail' : 'charge';
        if (
          enemy.alerted &&
          sameLevel &&
          !enemy.attackCooldown &&
          reaches(enemy, this.player, BALANCE[kind].range, enemy.direction)
        ) {
          enemy.attackTime = specialDuration(kind);
          enemy.attackFacing = enemy.direction;
          enemy.tailHit = false;
          enemy.attackCooldown =
            kind === 'tail' ? BALANCE.enemy.stegoCooldown : BALANCE.enemy.triceratopsCooldown;
        } else {
          const movement =
            enemy.direction *
            (enemy.alerted ? BALANCE.enemy.chaseSpeed : BALANCE.enemy.patrolSpeed) *
            FIELD *
            dt;
          if (!this.walkEnemy(enemy, movement) && !enemy.alerted) enemy.direction *= -1;
        }
      }
      // Only same-level body contact hurts Kenny; high platforms cannot be hit.
      if (!charging && sameLevel && overlaps(this.player, enemy))
        this.hurt(enemy, BALANCE.enemy.contactDamage);
      this.enemyGravity(enemy, dt);
    }
  }

  private walkEnemy(enemy: Enemy, movement: number, allowFall = false): boolean {
    const next = { ...enemy, x: enemy.x + movement };
    if (next.x < 0 || next.x + next.w > this.width) return false;
    // A charge may overshoot its patrol zone; allow movement BACK into the zone.
    if (
      !allowFall &&
      ((enemy.x >= enemy.min && next.x < enemy.min) ||
        (enemy.x <= enemy.max && next.x > enemy.max) ||
        (enemy.x < enemy.min && next.x < enemy.x) ||
        (enemy.x > enemy.max && next.x > enemy.x))
    )
      return false;
    // Keep a small natural gap between dinosaurs of the same ground lane.
    if (
      this.hardcore &&
      this.enemies.some(
        (other) =>
          other !== enemy &&
          other.alive &&
          Math.abs(other.y + other.h - enemy.y - enemy.h) < 15 &&
          next.x < other.x + other.w + BALANCE.enemyPursuit.separation * FIELD &&
          next.x + next.w > other.x - BALANCE.enemyPursuit.separation * FIELD,
      )
    )
      return false;
    const blocked = this.solids().some(
      (solid) =>
        !(solid as Platform).oneWay &&
        overlaps(next, solid) &&
        // Standing on a floor is not a wall; crossing a gate or cliff is.
        enemy.y + enemy.h > solid.y + 5,
    );
    if (blocked) return false;
    if (!allowFall) {
      const footX = movement > 0 ? next.x + next.w : next.x;
      const supported = this.platforms.some(
        (platform) =>
          Math.abs(platform.y - (enemy.y + enemy.h)) < 4 &&
          footX >= platform.x &&
          footX <= platform.x + platform.w,
      );
      if (!supported) return false;
    }
    enemy.x = next.x;
    return true;
  }

  private applyBleedTick(): void {
    if (this.dead) return;
    const amount = BALANCE.stegoBleed.damage;
    this.sinceDamage = 0;
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    this.health = Math.max(0, Math.round((this.health - (amount - absorbed)) * 100) / 100);
    if (this.defense === 'triceratops-frill' && this.shield <= 0) {
      this.fusions.delete('triceratops-frill');
      this.defense = null;
    }
    this.damageTexts.push({
      id: ++this.damageId,
      x: this.player.x + this.player.w / 2,
      y: this.player.y - 8,
      amount,
      shield: absorbed > 0,
      life: 0.85,
    });
    if (this.health <= 0) {
      this.bleedRemaining = 0;
      if (this.hardcore) this.die();
      else this.respawn();
    }
  }

  private hurt(
    enemy: Enemy,
    amount: number,
    special: boolean | 'tail' | 'charge' = false,
  ): boolean {
    if (this.invulnerable > 0) return false;
    this.sinceDamage = 0;
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    if (this.defense === 'triceratops-frill' && this.shield === 0) {
      this.fusions.delete(this.defense);
      this.defense = null;
    }
    this.health = Math.max(0, this.health - (amount - absorbed));
    const stunnedFor =
      special === 'charge' ? BALANCE.triceratopsStun : special ? BALANCE.specialStun : 0;
    this.invulnerable = Math.max(BALANCE.enemy.invulnerability, stunnedFor + 0.25);
    if (stunnedFor) {
      this.playerStun = stunnedFor;
      this.say(
        stunnedFor === 3
          ? 'Triceratops-Charge! Kenny ist 3 Sekunden betäubt.'
          : 'Stegosaurus-Treffer! Kenny ist 1 Sekunde betäubt und blutet.',
      );
      this.attackTime = 0;
      this.player.vx = 0;
    }
    this.damageTexts.push({
      id: ++this.damageId,
      x: this.player.x + this.player.w / 2,
      y: this.player.y,
      amount,
      shield: absorbed > 0,
      life: 0.85,
    });
    if (!stunnedFor && !this.attackTime) {
      this.player.vx = this.player.x < enemy.x ? -270 : 270;
      this.player.vy = -290;
    }
    if (!this.health) {
      if (this.hardcore) this.die();
      else this.respawn();
    }
    return true;
  }

  private solids(): Rect[] {
    return [
      ...this.platforms,
      ...(!this.switchOpen ? [this.gates[0]] : []),
      ...(this.runeProgress < 3 ? [this.gates[1]] : []),
    ];
  }

  private movePlatforms(): void {
    for (const platform of this.platforms) {
      if (platform.origin === undefined) continue;
      platform.previousX = platform.x;
      platform.x =
        platform.origin +
        Math.sin((this.elapsed / platform.period!) * Math.PI * 2) * platform.travel!;
      if (this.grounded === platform) this.player.x += platform.x - platform.previousX;
    }
  }

  private movePlayer(dt: number): void {
    const player = this.player;
    const solids = this.solids();
    player.x += player.vx * dt;
    for (const solid of solids) {
      if ((solid as Platform).oneWay || !overlaps(player, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.w;
      else if (player.vx < 0) player.x = solid.x + solid.w;
      player.vx = 0;
    }
    player.x = Math.max(0, Math.min(this.width - player.w, player.x));
    const previousFeet = player.y + player.h;
    player.y += player.vy * dt;
    this.grounded = undefined;
    for (const solid of solids) {
      if (!overlaps(player, solid)) continue;
      if ((solid as Platform).oneWay && !(player.vy >= 0 && previousFeet <= solid.y + 4)) continue;
      if (player.vy >= 0 && previousFeet <= solid.y + 4) {
        player.y = solid.y - player.h;
        this.grounded = this.platforms.find((platform) => platform === solid);
      } else if (player.vy < 0) {
        player.y = solid.y + solid.h;
      }
      player.vy = 0;
    }
  }

  private mapAmberId(index: number): string {
    return `stachelweide_${this.amberDay}_map_${index}`;
  }

  private collect(interact: boolean): void {
    const drop = this.nearbyDrop;
    if (interact && drop) {
      drop.collected = true;
      this.equipRun(drop.item);
      this.pickupEvents.push({ id: drop.id, item: drop.item });
    }
    this.amber.forEach((amber, i) => {
      if (
        !amber.collected &&
        overlaps(this.player, { x: amber.x - 10, y: amber.y - 10, w: 20, h: 20 })
      ) {
        amber.collected = true;
        this.amberCount++;
        this.amberEvents.push(this.mapAmberId(i));
      }
    });
    for (const crystal of this.enemyAmberDrops) {
      if (!crystal.collected && distanceInFields(this.player, crystal) <= BALANCE.pickup.range) {
        crystal.collected = true;
        this.amberCount++;
        this.amberEvents.push(crystal.id);
      }
    }
    this.checkpoints.forEach((x, index) => {
      if (index > this.checkpoint && Math.abs(this.player.x - x) < 45 && this.grounded)
        this.checkpoint = index;
    });
  }
}
