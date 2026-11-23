import { BALANCE, specialDuration } from './kenny-platformer.balance';
import { enemyAnimation } from './kenny-platformer.animation';
import { KennyWorld, WORLD_HEIGHT } from './kenny-platformer.world';
import { composeKennyDirectionalBite, drawKennyFusionCell } from './kenny-fusion-frame';

/** Canvas handles the scenery; Kenny remains a real, skin-aware animated sprite. */
export class KennyRenderer {
  readonly ready: Promise<void>;
  private readonly images = new Map<string, HTMLImageElement>();
  private readonly fusionPending = new Map<string, Promise<void>>();
  private readonly biteSources = new Map<
    string,
    { standing: HTMLCanvasElement; open: HTMLCanvasElement }
  >();
  camera = 0;
  scale = 1;
  private width = 960;
  private height = 540;
  private readonly ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas wird von diesem Browser nicht unterstützt.');
    this.ctx = context;
    const names = [
      'triceratops-walk',
      'stegosaurus-walk',
      'stegosaurus-attack',
      ...['blue', 'pink', 'green', 'red', 'zebra'].flatMap((skin) => [
        `${skin}-walk`,
        `${skin}-attack`,
      ]),
    ];
    const sources = [
      ...names.map((name) => ({ name, path: `kenny/animations/${name}.png?v=2` })),
      ...['triceratops-horns', 'triceratops-frill', 'stegosaurus-plates', 'stegosaurus-spikes'].map(
        (name) => ({
          name: `drop-${name}`,
          path: `kenny/hornweide/drops/${name === 'stegosaurus-spikes' ? 'stegosaurus-spikes-lowres' : name}.png`,
        }),
      ),
      { name: 'amber-icon', path: 'kenny/hornweide/ui/bernstein.png' },
      {
        name: 'stegosaurus-fusion-8poses',
        path: 'kenny/animations/fusions/stegosaurus-8poses.png?v=4',
      },
    ];
    this.ready = Promise.all(
      sources.map(
        ({ name, path }) =>
          new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              this.images.set(name, image);
              resolve();
            };
            image.onerror = () => reject(new Error(`Spielgrafik fehlt: ${path}`));
            image.src = new URL(path, document.baseURI).href;
          }),
      ),
    ).then(() => undefined);
  }

  /** Lazy-load only the equipped skin's real 1536px 8×8 PNG atlas.
   * Do not fetch all five 2–3MB atlases for every mobile player.
   */
  loadFusionAtlas(skin: string): Promise<void> {
    const selected = ['blue', 'pink', 'green', 'red', 'zebra'].includes(skin) ? skin : 'blue';
    if (this.images.has(`fusion-${selected}`)) return Promise.resolve();
    const previous = this.fusionPending.get(selected);
    if (previous) return previous;
    const task = new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (image.naturalWidth !== 1536 || image.naturalHeight !== 1536) {
          reject(new Error(`Ungültiger Fusionsatlas: ${selected}`));
          return;
        }
        this.images.set(`fusion-${selected}`, image);
        resolve();
      };
      image.onerror = () => reject(new Error(`Fusionsatlas fehlt: ${selected}`));
      image.src = new URL(
        `kenny/animations/fusions/${selected}-polished.png?v=6`,
        document.baseURI,
      ).href;
    });
    this.fusionPending.set(selected, task);
    void task.finally(() => this.fusionPending.delete(selected)).catch(() => undefined);
    return task;
  }

  hasFusionAtlas(skin: string): boolean {
    return this.images.has(`fusion-${skin}`);
  }

  /** Head-only jaw animation; all existing atlas armor, body pose and skin colors survive. */
  drawDirectionalBite(
    target: HTMLCanvasElement,
    skin: string,
    row: number | null,
    aim: number,
    progress: number,
  ): void {
    const key = `${skin}-${row ?? 'base'}`;
    let sources = this.biteSources.get(key);
    if (!sources) {
      const standing = document.createElement('canvas');
      const open = document.createElement('canvas');
      standing.width = standing.height = open.width = open.height = 192;
      if (row !== null) {
        const atlas = this.images.get(`fusion-${skin}`);
        if (!atlas) return;
        drawKennyFusionCell(standing, atlas, row, 0);
        drawKennyFusionCell(open, atlas, row, 5);
      } else {
        const walk = this.images.get(`${skin}-walk`);
        const attack = this.images.get(`${skin}-attack`);
        if (!walk || !attack) return;
        standing.getContext('2d')?.drawImage(walk, 0, 0, 192, 192, 0, 0, 192, 192);
        open.getContext('2d')?.drawImage(attack, 384, 0, 192, 192, 0, 0, 192, 192);
      }
      sources = { standing, open };
      this.biteSources.set(key, sources);
    }
    composeKennyDirectionalBite(target, sources.standing, sources.open, aim, progress);
  }

  /** The Canvas source crop prevents neighbouring 8×8 atlas cells bleeding into Kenny. */
  drawFusionSprite(canvas: HTMLCanvasElement, skin: string, row: number, pose: number): void {
    const atlas = this.images.get(`fusion-${skin}`);
    if (atlas) drawKennyFusionCell(canvas, atlas, row, pose);
  }

  resize(): void {
    const bounds = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, bounds.width);
    this.height = Math.max(1, bounds.height);
    const density = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.width * density);
    this.canvas.height = Math.round(this.height * density);
    this.scale = this.height / WORLD_HEIGHT;
  }

  draw(world: KennyWorld): void {
    const ctx = this.ctx;
    const viewport = this.width / this.scale;
    this.camera = Math.max(0, Math.min(world.width - viewport, world.player.x - viewport * 0.35));
    ctx.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / this.height, 0, 0);
    ctx.scale(this.scale, this.scale);
    // Pangaea at noon: warm sky, faraway valleys, prehistoric tree silhouettes.
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    sky.addColorStop(0, '#96d7e4');
    sky.addColorStop(0.55, '#dbedbb');
    sky.addColorStop(1, '#f5e6b0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewport, WORLD_HEIGHT);
    this.circle(viewport * 0.79 - this.camera * 0.025, 91, 45, '#fff4c5');
    this.circle(viewport * 0.79 - this.camera * 0.025, 91, 56, '#fff4c54a');
    // High, slow-moving clouds cannot be mistaken for stars.
    for (let i = -1; i < viewport / 430 + 2; i++) {
      const x = i * 430 - ((this.camera * 0.07) % 430) + 88;
      const y = 85 + ((i + 7) % 3) * 29;
      this.circle(x - 25, y + 7, 19, '#fff9e9aa');
      this.circle(x, y, 27, '#fff9e9aa');
      this.circle(x + 29, y + 9, 20, '#fff9e9aa');
    }
    for (let i = -2; i < viewport / 250 + 3; i++) {
      const x = i * 250 - ((this.camera * 0.17) % 250);
      this.polygon(
        [
          [x - 150, 440],
          [x + 105, 190 + ((i + 4) % 3) * 40],
          [x + 350, 440],
        ],
        '#a3be8b',
      );
      this.polygon(
        [
          [x - 60, 455],
          [x + 175, 275 + ((i + 5) % 3) * 32],
          [x + 395, 455],
        ],
        '#7eac7b',
      );
    }
    // Large fern trees provide depth, with slow parallax movement.
    for (let i = -2; i < viewport / 215 + 3; i++) {
      const x = i * 215 - ((this.camera * 0.36) % 215) + 30;
      const y = 445;
      const h = 125 + ((i + 7) % 3) * 27;
      this.drawFernTree(x, y, h, i % 2 ? '#387b58' : '#4b9065');
    }
    ctx.save();
    ctx.translate(-this.camera, 0);
    for (const platform of world.platforms) {
      if (!this.visible(platform.x, platform.w, viewport)) continue;
      if (platform.mountain) {
        // Rocky physical barrier: true collision silhouette has a reachable flat summit.
        this.polygon(
          [
            [platform.x, platform.y + platform.h],
            [platform.x, platform.y + 37],
            [platform.x + 20, platform.y + 12],
            [platform.x + 45, platform.y],
            [platform.x + platform.w - 37, platform.y],
            [platform.x + platform.w - 11, platform.y + 20],
            [platform.x + platform.w, platform.y + 37],
            [platform.x + platform.w, platform.y + platform.h],
          ],
          '#846d58',
        );
        this.polygon(
          [
            [platform.x + 8, platform.y + 40],
            [platform.x + 45, platform.y],
            [platform.x + 75, platform.y],
            [platform.x + 50, platform.y + 48],
            [platform.x + 58, platform.y + platform.h],
            [platform.x + 22, platform.y + platform.h],
          ],
          '#9c8973',
        );
        this.box(platform.x + 43, platform.y, platform.w - 79, 8, '#77bd69', 3);
        continue;
      }
      // Soil faces and lush grass tops replace neon-scifi rectangles.
      this.box(platform.x, platform.y, platform.w, platform.h, '#85654a', 5);
      this.box(
        platform.x + 3,
        platform.y + 12,
        platform.w - 6,
        Math.max(2, platform.h - 18),
        '#9f7952',
        3,
      );
      this.box(
        platform.x,
        platform.y,
        platform.w,
        10,
        platform.origin === undefined ? '#72b85d' : '#82c774',
        4,
      );
      this.box(platform.x, platform.y + 10, platform.w, 3, '#477b45', 1);
      for (let x = platform.x + 24; x < platform.x + platform.w - 10; x += 64) {
        this.circle(x + 7, platform.y + 27, 4, '#b18c64');
        this.polygon(
          [
            [x - 3, platform.y],
            [x - 8, platform.y - 8],
            [x, platform.y - 4],
            [x + 5, platform.y - 11],
            [x + 6, platform.y],
          ],
          '#3d874e',
        );
      }
      if (platform.origin !== undefined)
        this.label('↔', platform.x + platform.w / 2, platform.y + 18, '#fff4c8', 13);
    }
    world.hazards.forEach((hazard) => {
      if (hazard.h < 30) {
        this.box(hazard.x, hazard.y + 11, hazard.w, hazard.h - 11, '#865745', 0);
        for (let x = hazard.x; x < hazard.x + hazard.w; x += 17) {
          this.polygon(
            [
              [x, hazard.y + hazard.h],
              [x + 8, hazard.y - 7],
              [x + 17, hazard.y + hazard.h],
            ],
            '#e0d3b0',
          );
          this.polygon(
            [
              [x + 6, hazard.y + 8],
              [x + 8, hazard.y - 7],
              [x + 11, hazard.y + 10],
            ],
            '#fff4d5',
          );
        }
      } else this.drawLava(hazard, world.elapsed);
    });
    world.checkpoints.forEach((x, index) => {
      this.box(x, 380, 3, 70, '#b9cbc9', 0);
      this.polygon(
        [
          [x + 3, 380],
          [x + 32, 390],
          [x + 3, 402],
        ],
        index <= world.checkpoint ? '#8de9bf' : '#687b91',
      );
      this.label(index === 0 ? 'START' : `0${index}`, x + 15, 369, '#b7d4d0', 11);
    });
    world.gates.forEach((gate, index) => {
      const open = index === 0 ? world.switchOpen : world.runeProgress === 3;
      this.box(gate.x - 6, gate.y - 12, gate.w + 12, 12, '#607b78', 3);
      if (!open) {
        this.box(gate.x, gate.y, gate.w, gate.h, '#57716f', 3);
        for (let y = gate.y + 20; y < gate.y + gate.h; y += 35) {
          this.box(gate.x + 6, y, gate.w - 12, 3, '#c5d8b9', 0);
        }
      }
    });
    this.box(world.switchX - 15, 396, 30, 43, world.switchOpen ? '#8ce8c0' : '#e3b874', 8);
    this.label(world.switchOpen ? '✓' : 'J', world.switchX, 423, '#132a2b', 20);
    this.label('BEISSEN', world.switchX, 383, '#5c613b', 11);
    this.label('MOND → FARN → SONNE', world.runes[0].x + 40, 215, '#3b7753', 15);
    world.runes.forEach((rune, index) => {
      this.circle(rune.x, rune.y, 19, index < world.runeProgress ? '#a2e8c0' : '#394c5d');
      this.label(
        ['☾', '✦', '☀'][index],
        rune.x,
        rune.y + 6,
        index < world.runeProgress ? '#132b2e' : '#e5cfa6',
        23,
      );
      this.label(rune.label, rune.x, rune.y - 30, '#cee1db', 11);
    });
    world.amber.forEach((amber) => {
      if (amber.collected) return;
      const y = amber.y + Math.sin(world.elapsed * 3 + amber.x) * 3;
      const icon = this.images.get('amber-icon');
      if (icon) ctx.drawImage(icon, amber.x - 10, y - 12, 20, 23);
    });
    // Enemy amber is a separate physical pickup pool; unlike fixed map amber,
    // its receipt is unique per enemy and expedition.
    world.enemyAmberDrops.forEach((drop) => {
      if (drop.collected) return;
      const x = drop.x + drop.w / 2;
      const erupt =
        drop.checkpointReward && drop.pickupDelay
          ? Math.sin((1 - drop.pickupDelay / 0.65) * Math.PI) * 22
          : 0;
      const y = drop.y + drop.h / 2 - erupt;
      const icon = this.images.get('amber-icon');
      if (icon) ctx.drawImage(icon, x - 8, y - 10, 16, 20);
    });
    // A newly reached Pangea checkpoint flashes just like equipping a fusion.
    for (const burst of world.checkpointBursts) {
      const progress = 1 - burst.life / burst.duration;
      const fade = Math.min(1, burst.life / 0.22);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 15; i++) {
        const angle = (Math.PI * 2 * i) / 15 + 0.4;
        const radius = 9 + progress * (31 + (i % 4) * 6);
        const x = burst.x + Math.cos(angle) * radius;
        const y = burst.y + Math.sin(angle) * radius;
        this.circle(x, y, 4.5 - 2.5 * progress, i % 2 ? '#f5c785' : '#b7ffec');
        this.circle(x, y, 2 - progress, '#fff8db');
      }
      ctx.restore();
    }
    world.loot.forEach((drop) => {
      if (drop.collected) return;
      const icon = this.images.get(`drop-${drop.item}`);
      if (icon) ctx.drawImage(icon, drop.x - 6, drop.y - 10, 34, 34);
      if (world.nearbyDrop === drop) this.label('E', drop.x + 11, drop.y - 10, '#ffe0a5', 17);
    });
    world.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const state = enemyAnimation(enemy, world.elapsed);
      const fullStego =
        enemy.species === 'stegosaurus' ? this.images.get('stegosaurus-fusion-8poses') : undefined;
      const image = fullStego || this.images.get(`${enemy.species}-${state.animation}`);
      if (!image) return;
      const size = enemy.species === 'stegosaurus' ? 190 : 104;
      const bodyWidth = enemy.species === 'stegosaurus' ? 224 : size;
      const feet = enemy.y + enemy.h;
      ctx.save();
      ctx.translate(enemy.x + enemy.w / 2, feet);
      ctx.scale(state.facing, 1);
      const chargeElapsed = specialDuration('charge') - enemy.attackTime;
      const preparing =
        enemy.species === 'triceratops' &&
        enemy.attackTime > 0 &&
        chargeElapsed < BALANCE.charge.windup;
      if (preparing) {
        ctx.translate(Math.sin(world.elapsed * 38) * 1.4, 3);
        ctx.rotate(0.12);
      }
      ctx.drawImage(
        image,
        state.frame * (fullStego ? image.width / 4 : 192),
        fullStego && state.animation === 'attack' ? image.height / 2 : 0,
        fullStego ? image.width / 4 : 192,
        fullStego ? image.height / 2 : 192,
        -bodyWidth / 2,
        // The 8-pose atlas has ~95–110px of transparent padding below Stego's feet
        // in each 443px frame. Ground the artwork without changing its size or collision box.
        (-size * 180) / 192 + (fullStego ? (state.animation === 'attack' ? 29 : 35) : 0),
        bodyWidth,
        size,
      );
      ctx.restore();
      this.label(
        `${enemy.species === 'stegosaurus' ? 'STEGO' : 'TRICERATOPS'} · ${Math.ceil(enemy.health)} ♥`,
        enemy.x + enemy.w / 2,
        feet - size * 0.94 - 8,
        '#f5e5d1',
        11,
      );
      if (preparing) {
        this.label('! CHARGE', enemy.x + enemy.w / 2, feet - size - 28, '#ffba89', 14);
        this.box(enemy.x, feet - size - 20, enemy.w, 5, '#493b39', 2);
        this.box(
          enemy.x,
          feet - size - 20,
          enemy.w * Math.min(1, chargeElapsed / BALANCE.charge.windup),
          5,
          '#ffc08a',
          2,
        );
        for (let i = 0; i < 3; i++)
          this.circle(
            enemy.x + enemy.w / 2 - enemy.attackFacing * (12 + i * 12),
            feet - 3 - Math.abs(Math.sin(world.elapsed * 14 + i)) * 10,
            2 + i,
            '#d9b58f',
          );
      } else if (enemy.attackTime > 0.4 && enemy.species === 'stegosaurus')
        this.label('!', enemy.x + enemy.w / 2, feet - size, '#ffd492', 23);
      else if (enemy.alerted)
        this.label('•', enemy.x + enemy.w / 2, feet - size - 22, '#eeab99', 12);
    });
    // A brief, deterministic ring of magical sparks when Kenny equips a pickup.
    for (const burst of world.pickupBursts) {
      const progress = 1 - burst.life / burst.duration;
      const fade = Math.max(0, Math.min(1, burst.life / 0.18));
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12 + i * 0.35;
        const spread = 7 + progress * (23 + (i % 3) * 7);
        const x = burst.x + Math.cos(angle) * spread;
        const y = burst.y + Math.sin(angle) * spread * 0.85 - progress * 11;
        const radius = (i % 3 === 0 ? 3.4 : 2.1) * (1 - progress * 0.65);
        this.circle(x, y, radius + 2, i % 2 ? '#c385ff66' : '#ffd86c66');
        this.circle(x, y, radius, i % 2 ? '#dbaaff' : '#fff3a1');
      }
      ctx.restore();
    }
    this.box(world.exitX - 32, 320, 64, 130, '#8ddbab77', 32);
    ctx.strokeStyle = world.runeProgress === 3 ? '#a0f0cc' : '#647b7b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(world.exitX, 385, 27, 60, 0, 0, Math.PI * 2);
    ctx.stroke();
    this.label('ZIEL', world.exitX, 300, '#36764e', 14);
    for (const damage of world.damageTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, damage.life * 3);
      ctx.shadowColor = '#10192b';
      ctx.shadowBlur = 5;
      this.label(
        `−${Number(damage.amount.toFixed(2))} ❤️${damage.shield ? ' 🛡' : ''}`,
        damage.x,
        damage.y - 12,
        damage.shield ? '#b4efff' : '#ffc0b5',
        18,
      );
      ctx.restore();
    }
    ctx.restore();
  }

  private drawFernTree(x: number, floorY: number, height: number, green: string): void {
    const top = floorY - height;
    this.box(x - 5, top + 30, 10, height - 20, '#6b8651', 3);
    for (let j = 0; j < 4; j++) {
      const y = top + 26 + j * 24;
      const spread = 58 - j * 6;
      this.polygon(
        [
          [x, y + 15],
          [x - spread, y - 3],
          [x - spread + 11, y - 16],
          [x - 9, y - 5],
          [x, y + 1],
        ],
        green,
      );
      this.polygon(
        [
          [x, y + 15],
          [x + spread, y - 3],
          [x + spread - 11, y - 16],
          [x + 9, y - 5],
          [x, y + 1],
        ],
        green,
      );
    }
    this.circle(x, top + 20, 12, '#6cab6c');
  }

  private drawLava(hazard: { x: number; y: number; w: number; h: number }, time: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(hazard.x, hazard.y, hazard.w, hazard.h);
    ctx.clip();
    const gradient = ctx.createLinearGradient(0, hazard.y, 0, hazard.y + hazard.h);
    gradient.addColorStop(0, '#ffbd3f');
    gradient.addColorStop(0.3, '#ff7224');
    gradient.addColorStop(0.72, '#db3c18');
    gradient.addColorStop(1, '#942c25');
    ctx.fillStyle = gradient;
    ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);
    for (let band = 0; band < 3; band++) {
      const y = hazard.y + 8 + band * 18;
      const phase = time * (1.2 + band * 0.3);
      ctx.beginPath();
      ctx.moveTo(hazard.x - 20, y);
      for (let x = hazard.x - 20; x <= hazard.x + hazard.w + 20; x += 10) {
        const wave =
          Math.sin(x * 0.044 + phase + band * 2) * 5 + Math.sin(x * 0.09 - phase * 0.63) * 2;
        ctx.lineTo(x, y + wave);
      }
      ctx.strokeStyle = band === 0 ? '#fff08a' : band === 1 ? '#ff9a29' : '#b72e21';
      ctx.lineWidth = band === 0 ? 5 : 9;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    for (let i = 0; i < Math.max(3, Math.floor(hazard.w / 46)); i++) {
      const x = hazard.x + ((i * 47.7 + time * (13 + (i % 3))) % hazard.w);
      const float = (time * (0.7 + (i % 3) * 0.18) + i * 0.29) % 1;
      const radius = 3 + (i % 3) * 2;
      const y = hazard.y + hazard.h - float * (hazard.h + 12);
      ctx.globalAlpha = Math.min(1, (1 - float) * 1.9);
      this.circle(x, y, radius, i % 2 ? '#ffdb53' : '#ff961d');
      this.circle(x - radius / 3, y - radius / 3, radius / 3, '#fff4b4');
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  private visible(x: number, width: number, viewport: number): boolean {
    return x + width > this.camera - 50 && x < this.camera + viewport + 50;
  }

  private box(x: number, y: number, w: number, h: number, color: string, radius: number): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, radius);
    this.ctx.fill();
  }

  private circle(x: number, y: number, radius: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private polygon(points: number[][], color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    points.forEach(([x, y], index) => (index ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)));
    this.ctx.closePath();
    this.ctx.fill();
  }

  private label(text: string, x: number, y: number, color: string, size: number): void {
    this.ctx.fillStyle = color;
    this.ctx.font = `700 ${size}px system-ui, sans-serif`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, x, y);
  }
}
