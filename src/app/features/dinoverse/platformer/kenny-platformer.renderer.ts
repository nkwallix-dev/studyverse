import { BALANCE, specialDuration } from './kenny-platformer.balance';
import { enemyAnimation } from './kenny-platformer.animation';
import { KennyWorld, WORLD_HEIGHT, WORLD_WIDTH } from './kenny-platformer.world';

/** Canvas handles the scenery; Kenny remains a real, skin-aware animated sprite. */
export class KennyRenderer {
  readonly ready: Promise<void>;
  private readonly images = new Map<string, HTMLImageElement>();
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
    this.ready = Promise.all(
      names.map(
        (name) =>
          new Promise<void>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              this.images.set(name, image);
              resolve();
            };
            image.onerror = () => reject(new Error(`Sprite fehlt: ${name}`));
            image.src = new URL(`kenny/animations/${name}.png?v=2`, document.baseURI).href;
          }),
      ),
    ).then(() => undefined);
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
    this.camera = Math.max(0, Math.min(WORLD_WIDTH - viewport, world.player.x - viewport * 0.35));
    ctx.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / this.height, 0, 0);
    ctx.scale(this.scale, this.scale);
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
    sky.addColorStop(0, '#10192b');
    sky.addColorStop(0.65, '#27364a');
    sky.addColorStop(1, '#243a39');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, viewport, WORLD_HEIGHT);
    for (let i = 0; i < 45; i++) {
      const x =
        (((i * 137.7 - this.camera * 0.08) % (viewport + 60)) + viewport + 60) % (viewport + 60);
      ctx.globalAlpha = 0.25 + (Math.sin(i * 4.2) + 1) * 0.2;
      this.circle(x, 20 + ((i * 53) % 245), i % 4 === 0 ? 2 : 1, '#c2d8db');
    }
    ctx.globalAlpha = 1;
    this.circle(viewport * 0.76 - this.camera * 0.035, 115, 66, '#efc495');
    for (let i = -1; i < viewport / 300 + 2; i++) {
      const x = i * 300 - ((this.camera * 0.22) % 300);
      this.polygon(
        [
          [x - 80, 450],
          [x + 145, 176 + (i % 2) * 45],
          [x + 360, 450],
        ],
        '#1a2939',
      );
      this.polygon(
        [
          [x + 115, 214],
          [x + 145, 176 + (i % 2) * 45],
          [x + 175, 214],
        ],
        '#536275',
      );
    }
    // Fern forest silhouettes move more slowly than the walkable world.
    const foliageOffset = (this.camera * 0.38) % 215;
    for (let i = -1; i < viewport / 215 + 2; i++) {
      const x = i * 215 - foliageOffset + 70;
      const height = 88 + ((i + 6) % 3) * 23;
      const stemTop = 454 - height;
      ctx.strokeStyle = '#1d433c';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x, 454);
      ctx.quadraticCurveTo(x - 16, stemTop + 35, x + 8, stemTop);
      ctx.stroke();
      for (let leaf = 0; leaf < 5; leaf++) {
        const y = 433 - leaf * (height / 6);
        const half = 45 - leaf * 6;
        this.polygon(
          [
            [x, y],
            [x - half, y - 11],
            [x - half - 14, y - 28],
            [x - 9, y - 8],
          ],
          '#254c42',
        );
        this.polygon(
          [
            [x, y],
            [x + half, y - 13],
            [x + half + 9, y - 31],
            [x + 7, y - 8],
          ],
          '#2b5547',
        );
      }
    }
    ctx.save();
    ctx.translate(-this.camera, 0);
    for (const platform of world.platforms) {
      if (!this.visible(platform.x, platform.w, viewport)) continue;
      this.box(
        platform.x,
        platform.y,
        platform.w,
        platform.h,
        platform.origin === undefined ? '#304a49' : '#786b64',
        4,
      );
      this.box(
        platform.x,
        platform.y,
        platform.w,
        5,
        platform.origin === undefined ? '#8cd2ab' : '#f2cc8b',
        3,
      );
      ctx.strokeStyle = '#ffffff10';
      ctx.lineWidth = 1;
      for (let x = platform.x + 20; x < platform.x + platform.w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, platform.y + 8);
        ctx.lineTo(x - 8, platform.y + Math.min(32, platform.h));
        ctx.stroke();
      }
      if (platform.origin !== undefined) {
        this.label('↔', platform.x + platform.w / 2, platform.y + 17, '#ffe1b3', 13);
      }
    }
    world.hazards.forEach((hazard) => {
      if (hazard.h < 30) {
        for (let x = hazard.x; x < hazard.x + hazard.w; x += 18) {
          this.polygon(
            [
              [x, 450],
              [x + 9, hazard.y],
              [x + 18, 450],
            ],
            '#dba19c',
          );
        }
      } else {
        this.box(hazard.x, hazard.y, hazard.w, hazard.h, '#a24a3d', 0);
        for (let x = hazard.x; x < hazard.x + hazard.w; x += 24) {
          this.circle(x + 12, hazard.y + 5 + Math.sin(world.elapsed * 3 + x) * 3, 13, '#e7a262');
        }
      }
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
    this.box(1719, 396, 30, 43, world.switchOpen ? '#8ce8c0' : '#e3b874', 8);
    this.label(world.switchOpen ? '✓' : 'J', 1734, 423, '#132a2b', 20);
    this.label('BEISSEN', 1734, 383, '#e5cfa6', 11);
    this.label('MOND → FARN → SONNE', 4025, 215, '#f5dcad', 15);
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
      this.polygon(
        [
          [amber.x, y - 10],
          [amber.x + 7, y],
          [amber.x, y + 10],
          [amber.x - 7, y],
        ],
        '#f5cc7c',
      );
      this.circle(amber.x - 1, y - 3, 2, '#fff0bb');
    });
    // Enemy amber is a separate physical pickup pool; unlike fixed map amber,
    // its receipt is unique per enemy and expedition.
    world.enemyAmberDrops.forEach((drop) => {
      if (drop.collected) return;
      const x = drop.x + drop.w / 2;
      const y = drop.y + drop.h / 2;
      this.polygon(
        [
          [x, y - 8],
          [x + 6, y],
          [x, y + 8],
          [x - 6, y],
        ],
        '#f6ba59',
      );
      this.circle(x - 1, y - 2, 2, '#fff1b1');
    });
    world.loot.forEach((drop) => {
      if (drop.collected) return;
      this.box(drop.x, drop.y, drop.w, drop.h, '#d79aee', 5);
      this.label(
        drop.item.includes('horns') ? '▲' : drop.item.includes('spikes') ? '✦' : '⬟',
        drop.x + 11,
        drop.y + 17,
        '#241329',
        16,
      );
      if (world.nearbyDrop === drop) this.label('E', drop.x + 11, drop.y - 10, '#ffe0a5', 17);
    });
    world.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const state = enemyAnimation(enemy, world.elapsed);
      const image = this.images.get(`${enemy.species}-${state.animation}`);
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
        state.frame * 192,
        0,
        192,
        192,
        -bodyWidth / 2,
        (-size * 180) / 192,
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
    this.box(5110, 320, 64, 130, '#96e9c91a', 32);
    ctx.strokeStyle = world.runeProgress === 3 ? '#a0f0cc' : '#647b7b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(5142, 385, 27, 60, 0, 0, Math.PI * 2);
    ctx.stroke();
    this.label('ZIEL', 5142, 300, '#c6e9d3', 14);
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
    const player = world.player;
    const aim = world.attackTime > 0 ? world.attackAim : world.aim;
    const facing = world.attackTime > 0 ? world.attackFacing : player.facing;
    const targetX = player.x + player.w / 2 + (aim === 0 ? facing * 47 : 0);
    const targetY = player.y + player.h / 2 + aim * 50;
    ctx.strokeStyle = world.attackTime > 0 ? '#ffe2a3' : '#b5ecd6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 7, 0, Math.PI * 2);
    ctx.moveTo(targetX - 11, targetY);
    ctx.lineTo(targetX + 11, targetY);
    ctx.moveTo(targetX, targetY - 11);
    ctx.lineTo(targetX, targetY + 11);
    ctx.stroke();
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
