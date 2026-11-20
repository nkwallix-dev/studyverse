/** World coordinates stay independent of viewport size and rendering. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Controls {
  axis: number;
  crouch: boolean;
  jump: boolean;
  jumpHeld: boolean;
  bite: boolean;
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
}

export const WORLD_WIDTH = 5300;
export const WORLD_HEIGHT = 540;
export const STEP = 1 / 120;
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

/** One compact course: ravine, crawl tunnel, bite gate, ferries, rune temple. */
export class KennyWorld {
  readonly platforms: Platform[] = [
    floor(0, 520),
    floor(650, 1890),
    floor(3540, 1760),
    ledge(280, 360, 145),
    ledge(470, 240, 110),
    ledge(850, 355, 140),
    { x: 1260, y: 305, w: 380, h: 110 },
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
  biteTime = 0;
  invulnerable = 0;
  message = 'Los geht’s! Über die Schlucht: laufen, dann springen.';
  private messageTime = 0;
  private jumpBuffer = 0;
  private coyote = 0;
  private biteCooldown = 0;
  private lastZone = -1;

  get progress(): number {
    return Math.min(100, Math.round((this.player.x / 5120) * 100));
  }

  get hint(): string {
    if (this.messageTime > 0) return this.message;
    const x = this.player.x;
    if (x < 1100) return 'A / D bewegen · Leertaste springen · J beißen';
    if (x < 1660) return 'Kriechgang: S halten. Unter der Decke kannst du nicht aufstehen.';
    if (x < 1900 && !this.switchOpen)
      return 'Stell dich vor den goldenen Schalter und beiß mit J zu.';
    if (x < 2500)
      return 'Über die Stacheln springen. Die Fahne dahinter speichert deinen Checkpoint.';
    if (x < 3700)
      return 'Die Steinplatten bewegen sich. Mitfahren, auf die nächste Insel springen.';
    if (this.runeProgress < 3) {
      return `Tempelrätsel: MOND → FARN → SONNE. Als Nächstes: ${this.runes[this.runeProgress].label} mit J aktivieren.`;
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
    this.biteTime = 0;
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
    this.biteTime = Math.max(0, this.biteTime - dt);
    this.biteCooldown = Math.max(0, this.biteCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.movePlatforms();
    this.crouch(input.crouch);
    this.jumpBuffer = input.jump ? 0.12 : Math.max(0, this.jumpBuffer - dt);
    this.coyote = this.grounded ? 0.1 : Math.max(0, this.coyote - dt);
    const player = this.player;
    const speed = input.crouch ? 125 : 280;
    const target = Math.max(-1, Math.min(1, input.axis)) * speed;
    const acceleration = (this.grounded ? 2400 : 1600) * dt;
    player.vx += Math.max(-acceleration, Math.min(acceleration, target - player.vx));
    if (input.axis) player.facing = Math.sign(input.axis);
    if (this.jumpBuffer > 0 && this.coyote > 0 && player.h === 60) {
      player.vy = -650;
      this.grounded = undefined;
      this.coyote = 0;
      this.jumpBuffer = 0;
    }
    if (!input.jumpHeld && player.vy < -260) player.vy = -260;
    player.vy += 1700 * dt;
    this.movePlayer(dt);
    if (input.bite && this.biteCooldown === 0) {
      this.biteTime = 0.34;
      this.biteCooldown = 0.42;
      this.bite();
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
    return { x, y: 414, w: 40, h: 36, min, max, direction: -1, armored, alive: true, stun: 0 };
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

  private crouch(pressed: boolean): void {
    const player = this.player;
    if (pressed && player.h === 60) {
      player.y += 28;
      player.h = 32;
    } else if (!pressed && player.h === 32) {
      const standing = { ...player, y: player.y - 28, h: 60 };
      if (!this.solids().some((solid) => overlaps(standing, solid))) {
        player.y -= 28;
        player.h = 60;
      }
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

  private bite(): void {
    const player = this.player;
    const mouth: Rect = {
      x: player.facing > 0 ? player.x + player.w - 4 : player.x - 51,
      y: player.y + 6,
      w: 55,
      h: player.h - 6,
    };
    if (overlaps(mouth, { x: 1722, y: 396, w: 24, h: 43 }) && !this.switchOpen) {
      this.switchOpen = true;
      this.say('Knack! Das Steintor ist offen.');
    }
    this.runes.forEach((rune, index) => {
      if (
        this.runeProgress === 3 ||
        !overlaps(mouth, { x: rune.x - 13, y: rune.y - 17, w: 26, h: 34 })
      )
        return;
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
      if (!enemy.alive || !overlaps(mouth, enemy)) continue;
      if (enemy.armored && player.facing !== enemy.direction) {
        enemy.stun = 0.9;
        this.say('Vorne gepanzert! Spring über ihn und beiß von hinten.');
      } else {
        enemy.alive = false;
        this.say('Haps! Der Weg ist frei.');
      }
    }
  }

  private moveEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.stun = Math.max(0, enemy.stun - dt);
      if (!enemy.stun) enemy.x += enemy.direction * (enemy.armored ? 45 : 65) * dt;
      if (enemy.x < enemy.min || enemy.x > enemy.max) {
        enemy.x = Math.max(enemy.min, Math.min(enemy.max, enemy.x));
        enemy.direction *= -1;
      }
      if (!overlaps(this.player, enemy) || this.invulnerable > 0 || enemy.stun > 0) continue;
      this.health--;
      this.invulnerable = 1.3;
      this.player.vx = this.player.x < enemy.x ? -270 : 270;
      this.player.vy = -290;
      if (this.health <= 0) {
        this.respawn();
        return;
      }
      this.say('Autsch! Mit J fressen oder drüberspringen.');
    }
  }

  private collect(): void {
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
