import { ItemId, DinoSpecies, dropsFor } from '../equipment/companion-equipment.model';
/** World coordinates stay independent of viewport size and rendering. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Controls {
  axis: number;
  aim: number;
  jump: boolean;
  jumpHeld: boolean;
  attack: boolean;
}

export interface Platform extends Rect {
  origin?: number;
  travel?: number;
  period?: number;
  previousX?: number;
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
  attackTime: number;
  attackCooldown: number;
  attackFacing: number;
  tailHit: boolean;
}

export const WORLD_WIDTH = 5300;
export const WORLD_HEIGHT = 540;
export const STEP = 1 / 120;
export const ATTACK_DURATION = 0.5;
export const ATTACK_WINDUP = 0.08;
export const ATTACK_TRAVEL_TIME = 0.3;
export const ATTACK_DISTANCE = 150;
export const STEGO_ATTACK_DURATION = 0.8;
export const overlaps = (a: Rect, b: Rect): boolean =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const floor = (x: number, w: number): Platform => ({ x, y: 450, w, h: 90 });
const ledge = (x: number, y: number, w: number): Platform => ({ x, y, w, h: 22 });
const ferry = (x: number, y: number, travel: number, period: number): Platform => ({
  ...ledge(x, y, 112),
  origin: x,
  previousX: x,
  travel,
  period,
});

/** One compact course: ravine, full-height ruins, strike gate, ferries, rune temple. */
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
  readonly runId = crypto.randomUUID();
  readonly loot: (Rect & { id: string; item: ItemId; collected: boolean })[] = [];
  readonly pickupEvents: { id: string; item: ItemId }[] = [];
  readonly fusions = new Set<ItemId>();
  constructor(startItem: ItemId | null = null) {
    if (startItem) this.fusions.add(startItem);
    this.grounded = this.platforms[0];
  }
  player = { x: 90, y: 390, w: 34, h: 60, vx: 0, vy: 0, facing: 1 };
  grounded: Platform | undefined;
  elapsed = 0;
  checkpoint = 0;
  health = 3;
  deaths = 0;
  amberCount = 0;
  switchOpen = false;
  runeProgress = 0;
  won = false;
  attackTime = 0;
  aim = 0;
  attackAim = 0;
  attackFacing = 1;
  private attackLaunched = false;
  private attackHits = new Set<Enemy>();
  private activatedRunes = new Set<number>();
  invulnerable = 0;
  message = 'Los geht’s! Über die Schlucht: laufen, dann springen.';
  private messageTime = 0;
  private jumpBuffer = 0;
  private coyote = 0;
  private attackCooldown = 0;
  private lastZone = -1;

  get progress(): number {
    return Math.min(100, Math.round((this.player.x / 5120) * 100));
  }

  get hint(): string {
    if (this.messageTime > 0) return this.message;
    const x = this.player.x;
    if (x < 1100) return 'A / D bewegen · Leertaste springen · W / S zielen · J Sprungangriff';
    if (x < 1660) return 'Durch die Ruinen: W zielt nach oben, S nach unten. Space springt.';
    if (x < 1900 && !this.switchOpen)
      return 'Stell dich vor den goldenen Schalter und aktiviere ihn mit J.';
    if (x < 2500)
      return 'Über die Stacheln springen. Die Fahne dahinter speichert deinen Checkpoint.';
    if (x < 3700)
      return 'Die Steinplatten bewegen sich. Mitfahren, auf die nächste Insel springen.';
    if (this.runeProgress < 3) {
      return `Tempelrätsel: MOND → FARN → SONNE. Als Nächstes: ${this.runes[this.runeProgress].label} mit einem J-Angriff aktivieren.`;
    }
    return 'Das Tempeltor ist offen! Erreiche das leuchtende Portal rechts.';
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
    this.health = 3;
    this.grounded = undefined;
    this.jumpBuffer = 0;
    this.coyote = 0;
    this.attackTime = 0;
    this.attackCooldown = 0;
    this.invulnerable = 1.5;
    this.deaths++;
    this.say('Zurück am Checkpoint. Bernstein und gelöste Schalter bleiben erhalten.');
  }

  step(dt: number, input: Controls): void {
    if (this.won) return;
    // Bound catch-up work: a suspended tab must never teleport the player.
    dt = Math.min(STEP, Math.max(0, dt));
    this.elapsed += dt;
    this.messageTime = Math.max(0, this.messageTime - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.movePlatforms();
    const player = this.player;
    this.aim = Math.max(-1, Math.min(1, input.aim));
    if (input.attack && this.attackTime <= 0 && this.attackCooldown === 0) {
      if (input.axis) player.facing = Math.sign(input.axis);
      this.attackTime = ATTACK_DURATION;
      this.attackCooldown = 0.78;
      this.attackFacing = player.facing;
      this.attackAim = this.aim;
      this.attackLaunched = false;
      this.attackHits.clear();
      this.activatedRunes.clear();
    }
    if (this.attackTime > 0) {
      const elapsed = ATTACK_DURATION - this.attackTime;
      player.facing = this.attackFacing;
      const active =
        elapsed + 1e-9 >= ATTACK_WINDUP && elapsed < ATTACK_WINDUP + ATTACK_TRAVEL_TIME - 1e-9;
      player.vx = active ? (this.attackFacing * ATTACK_DISTANCE) / ATTACK_TRAVEL_TIME : 0;
      if (active && !this.attackLaunched) {
        player.vy =
          this.attackAim < 0 ? -520 : this.attackAim > 0 ? (this.grounded ? -200 : 250) : -340;
        this.attackLaunched = true;
        this.grounded = undefined;
        this.jumpBuffer = 0;
        this.coyote = 0;
      }
    } else {
      this.jumpBuffer = input.jump ? 0.12 : Math.max(0, this.jumpBuffer - dt);
      this.coyote = this.grounded ? 0.1 : Math.max(0, this.coyote - dt);
      const target = Math.max(-1, Math.min(1, input.axis)) * 280;
      const acceleration = (this.grounded ? 2400 : 1600) * dt;
      player.vx += Math.max(-acceleration, Math.min(acceleration, target - player.vx));
      if (input.axis) player.facing = Math.sign(input.axis);
      if (this.jumpBuffer > 0 && this.coyote > 0) {
        player.vy = -650;
        this.grounded = undefined;
        this.coyote = 0;
        this.jumpBuffer = 0;
      }
      if (!input.jumpHeld && player.vy < -260) player.vy = -260;
    }
    player.vy += 1700 * dt;
    this.movePlayer(dt);
    if (this.attackTime > 0) {
      const elapsed = ATTACK_DURATION - this.attackTime;
      if (elapsed + 1e-9 >= ATTACK_WINDUP && elapsed < ATTACK_WINDUP + ATTACK_TRAVEL_TIME)
        this.strike();
      this.attackTime = Math.max(0, this.attackTime - dt);
    }
    this.moveEnemies(dt);
    this.collect();
    if (this.hazards.some((hazard) => overlaps(player, hazard)) || player.y > WORLD_HEIGHT + 60) {
      this.respawn();
    }
    if (this.runeProgress === 3 && this.player.x > 5110) {
      this.won = true;
      this.say('Geschafft! Kenny hat den Urzeitpfad gemeistert.');
    }
  }

  private enemy(x: number, min: number, max: number, armored: boolean): Enemy {
    const tier = armored ? 'elite' : x > 1000 ? 'medium' : 'basic';
    return {
      x,
      y: 398,
      w: 84,
      h: 52,
      min,
      max,
      direction: -1,
      armored,
      alive: true,
      stun: 0,
      species: armored ? 'stegosaurus' : 'triceratops',
      tier,
      health: tier === 'elite' ? 7 : tier === 'medium' ? 4 : 2,
      poison: 0,
      attackTime: 0,
      attackCooldown: 0,
      attackFacing: -1,
      tailHit: false,
    };
  }

  private say(message: string): void {
    this.message = message;
    this.messageTime = 3;
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
      if (!overlaps(player, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.w;
      else if (player.vx < 0) player.x = solid.x + solid.w;
      player.vx = 0;
    }
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
    const previousFeet = player.y + player.h;
    player.y += player.vy * dt;
    this.grounded = undefined;
    for (const solid of solids) {
      if (!overlaps(player, solid)) continue;
      if (player.vy >= 0 && previousFeet <= solid.y + 4) {
        player.y = solid.y - player.h;
        this.grounded = this.platforms.find((platform) => platform === solid);
      } else if (player.vy < 0) {
        player.y = solid.y + solid.h;
      }
      player.vy = 0;
    }
  }

  private strike(): void {
    const player = this.player;
    const mouth: Rect = {
      x: player.facing > 0 ? player.x + player.w - 4 : player.x - 51,
      y: player.y + 6,
      w: 55,
      h: player.h - 6,
    };
    const hitbox: Rect =
      this.attackAim === 0
        ? mouth
        : {
            x: player.x - 10,
            y: this.attackAim < 0 ? player.y - 48 : player.y + player.h - 8,
            w: player.w + 20,
            h: 56,
          };
    if (overlaps(mouth, { x: 1722, y: 396, w: 24, h: 43 }) && !this.switchOpen) {
      this.switchOpen = true;
      this.say('Knack! Das Steintor ist offen.');
    }
    this.runes.forEach((rune, index) => {
      if (
        this.runeProgress === 3 ||
        this.activatedRunes.has(index) ||
        !overlaps(mouth, { x: rune.x - 13, y: rune.y - 17, w: 26, h: 34 })
      )
        return;
      this.activatedRunes.add(index);
      if (index === this.runeProgress) {
        this.runeProgress++;
        this.say(
          this.runeProgress === 3
            ? 'Alle drei Runen leuchten. Das Tempeltor ist offen!'
            : `${rune.label} aktiviert. Weiter zur nächsten Rune!`,
        );
      } else {
        this.runeProgress = index === 0 ? 1 : 0;
        this.say('Falsche Reihenfolge. Der Hinweis lautet: MOND → FARN → SONNE.');
      }
    });
    for (const enemy of this.enemies) {
      const tail: Rect = {
        x: player.facing > 0 ? player.x - 55 : player.x + player.w,
        y: player.y + 12,
        w: 55,
        h: player.h - 12,
      };
      const tailHit = this.fusions.has('stegosaurus-spikes') && overlaps(tail, enemy);
      if (!enemy.alive || this.attackHits.has(enemy) || (!overlaps(hitbox, enemy) && !tailHit))
        continue;
      this.attackHits.add(enemy);
      if (enemy.armored && player.facing !== enemy.direction) {
        enemy.stun = 0.9;
        this.say('Vorne gepanzert! Spring über ihn und greif von hinten an.');
      } else {
        enemy.health -= this.fusions.has('triceratops-horns') ? 2 : 1;
        if (this.fusions.has('stegosaurus-spikes')) enemy.poison = 4;
        if (enemy.health <= 0) this.defeat(enemy);
        else {
          enemy.stun = 0.45;
          this.say(`Treffer! Noch ${Math.ceil(enemy.health)} Herzen.`);
        }
      }
    }
  }

  private defeat(enemy: Enemy): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    const index = this.enemies.indexOf(enemy);
    dropsFor(enemy.species, enemy.tier).forEach((item, drop) => {
      this.loot.push({
        id: `${this.runId}_${index}_${drop}`,
        item,
        x: enemy.x + drop * 28,
        y: enemy.y + 10,
        w: 22,
        h: 22,
        collected: false,
      });
    });
    this.say('Besiegt! Heb die Beute auf, um mit ihr zu fusionieren.');
  }

  private moveEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.poison > 0) {
        enemy.health -= Math.min(dt, enemy.poison) * 0.25;
        enemy.poison = Math.max(0, enemy.poison - dt);
        if (enemy.health <= 0) {
          this.defeat(enemy);
          continue;
        }
      }
      enemy.stun = Math.max(0, enemy.stun - dt);
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);
      if (
        enemy.species === 'stegosaurus' &&
        !enemy.stun &&
        enemy.attackTime <= 0 &&
        enemy.attackCooldown === 0 &&
        Math.abs(this.player.x - enemy.x) < 155 &&
        Math.abs(this.player.y + this.player.h - (enemy.y + enemy.h)) < 65
      ) {
        enemy.attackTime = STEGO_ATTACK_DURATION;
        enemy.attackCooldown = 1.9;
        enemy.attackFacing = this.player.x < enemy.x ? -1 : 1;
        enemy.direction = enemy.attackFacing;
        enemy.tailHit = false;
      }
      if (enemy.attackTime > 0) {
        const progress = 1 - enemy.attackTime / STEGO_ATTACK_DURATION;
        if (progress >= 0.5) {
          enemy.direction = -enemy.attackFacing;
          const tail: Rect = {
            x: enemy.attackFacing > 0 ? enemy.x + enemy.w - 10 : enemy.x - 95,
            y: enemy.y - 5,
            w: 105,
            h: enemy.h + 5,
          };
          if (progress < 0.85 && !enemy.tailHit && overlaps(this.player, tail)) {
            enemy.tailHit = true;
            this.hurt(enemy);
          }
        }
        enemy.attackTime = Math.max(0, enemy.attackTime - dt);
      } else if (!enemy.stun) enemy.x += enemy.direction * (enemy.armored ? 45 : 65) * dt;
      if (enemy.x < enemy.min || enemy.x > enemy.max) {
        enemy.x = Math.max(enemy.min, Math.min(enemy.max, enemy.x));
        enemy.direction *= -1;
      }
      if (enemy.species !== 'stegosaurus' && overlaps(this.player, enemy) && enemy.stun === 0)
        this.hurt(enemy);
    }
  }

  private hurt(enemy: Enemy): void {
    if (this.invulnerable > 0) return;
    const inFront = (enemy.x - this.player.x) * this.player.facing >= 0;
    if (
      (inFront && this.fusions.has('triceratops-frill')) ||
      (!inFront && this.fusions.has('stegosaurus-plates'))
    ) {
      enemy.stun = 0.7;
      return;
    }
    this.health--;
    this.invulnerable = 1.3;
    this.player.vx = this.player.x < enemy.x ? -270 : 270;
    this.player.vy = -290;
    if (this.health <= 0) this.respawn();
    else this.say('Autsch! Space weicht aus, J startet deinen Sprungangriff.');
  }

  private collect(): void {
    for (const drop of this.loot) {
      if (drop.collected || !overlaps(this.player, drop)) continue;
      drop.collected = true;
      this.fusions.add(drop.item);
      this.pickupEvents.push({ id: drop.id, item: drop.item });
      this.say('Fusion aktiviert! Neue Fähigkeit für diesen Run.');
    }
    for (const amber of this.amber) {
      if (
        !amber.collected &&
        overlaps(this.player, { x: amber.x - 10, y: amber.y - 10, w: 20, h: 20 })
      ) {
        amber.collected = true;
        this.amberCount++;
      }
    }
    this.checkpoints.forEach((x, index) => {
      if (index > this.checkpoint && Math.abs(this.player.x - x) < 45 && this.grounded) {
        this.checkpoint = index;
        this.say(`Checkpoint ${index} erreicht. Dein Rückweg ist gesichert.`);
      }
    });
    const zone =
      this.player.x < 1100
        ? 0
        : this.player.x < 1900
          ? 1
          : this.player.x < 2500
            ? 2
            : this.player.x < 3700
              ? 3
              : 4;
    if (zone !== this.lastZone) {
      this.lastZone = zone;
      if (zone > 0) this.messageTime = 0;
    }
  }
}
