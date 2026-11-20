import { playerAnimation } from './kenny-platformer.animation';
import { ItemId, COMPANION_ITEMS } from '../equipment/companion-equipment.model';
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Controls, KennyWorld, STEP } from './kenny-platformer.world';
import { KennyRenderer } from './kenny-platformer.renderer';

type Action = 'left' | 'right' | 'aimUp' | 'aimDown' | 'jump' | 'attack';
type Status = 'ready' | 'playing' | 'paused' | 'won' | 'error';
interface RecordTime {
  seconds: number;
  amber: number;
}
const RECORD_KEY = 'studyverse_kenny_platformer_v1';
const KEYS: Record<string, Action> = {
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyS: 'aimDown',
  ArrowDown: 'aimDown',
  KeyW: 'aimUp',
  ArrowUp: 'aimUp',
  Space: 'jump',
  KeyJ: 'attack',
};

@Component({
  selector: 'app-kenny-platformer',
  imports: [CommonModule],
  templateUrl: './kenny-platformer.component.html',
  styleUrl: './kenny-platformer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KennyPlatformerComponent implements AfterViewInit, OnDestroy {
  @Input() skin = 'blue';
  @Input() startItem: ItemId | null = null;
  @Output() pickupCollected = new EventEmitter<{ id: string; item: ItemId }>();
  readonly fusionNames = signal<string[]>([]);
  @Input() available = false;
  @Output() exitRequested = new EventEmitter<void>();
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sprite', { static: true }) sprite!: ElementRef<HTMLDivElement>;
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLDivElement>;
  @ViewChild('dialogAction') dialogAction?: ElementRef<HTMLButtonElement>;

  readonly status = signal<Status>('ready');
  readonly assetsReady = signal(false);
  readonly hud = signal({
    amber: 0,
    time: '0:00',
    health: 3,
    checkpoint: 0,
    progress: 0,
    runes: 0,
    deaths: 0,
  });
  readonly hint = signal('');
  readonly record = signal<RecordTime | undefined>(this.readRecord());
  readonly touchControls: { action: Action; label: string; symbol: string }[] = [
    { action: 'left', label: 'Nach links', symbol: '←' },
    { action: 'right', label: 'Nach rechts', symbol: '→' },
    { action: 'aimUp', label: 'Oben zielen', symbol: 'W' },
    { action: 'aimDown', label: 'Unten zielen', symbol: 'S' },
    { action: 'attack', label: 'Sprungangriff', symbol: 'J' },
    { action: 'jump', label: 'Springen', symbol: '⤒' },
  ];
  private readonly zone = inject(NgZone);
  private world = new KennyWorld();
  private renderer?: KennyRenderer;
  private observer?: ResizeObserver;
  private frame = 0;
  private previousTime = 0;
  private accumulator = 0;
  private hudTime = 0;
  private keys = new Set<string>();
  private pointers = new Map<number, Action>();
  private jumpQueued = false;
  private attackQueued = false;
  private destroyed = false;

  ngAfterViewInit(): void {
    try {
      this.renderer = new KennyRenderer(this.canvas.nativeElement);
      void this.renderer.ready
        .then(() => {
          if (!this.destroyed) this.zone.run(() => this.assetsReady.set(true));
        })
        .catch(() => {
          if (!this.destroyed) this.zone.run(() => this.status.set('error'));
        });
      this.observer = new ResizeObserver(() => {
        this.renderer?.resize();
        this.render();
      });
      this.observer.observe(this.stage.nativeElement);
      this.renderer.resize();
      this.publishHud();
      this.render();
      this.zone.runOutsideAngular(() => {
        this.frame = requestAnimationFrame((time) => this.tick(time));
      });
    } catch {
      this.status.set('error');
    }
    this.focusDialog();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.clearInput();
  }

  start(): void {
    if (!this.available || !this.renderer || !this.assetsReady()) return;
    this.world = new KennyWorld(this.startItem);
    this.fusionNames.set(
      [...this.world.fusions].map((id) => COMPANION_ITEMS.find((item) => item.id === id)!.name),
    );
    this.accumulator = 0;
    this.clearInput();
    this.publishHud();
    this.status.set('playing');
    requestAnimationFrame(() => {
      if (!this.destroyed) this.canvas.nativeElement.focus();
    });
  }

  pause(): void {
    if (this.status() !== 'playing') return;
    this.status.set('paused');
    this.clearInput();
    this.focusDialog();
  }

  resume(): void {
    if (!this.available || this.status() !== 'paused') return;
    this.clearInput();
    this.status.set('playing');
    requestAnimationFrame(() => {
      if (!this.destroyed) this.canvas.nativeElement.focus();
    });
  }

  checkpoint(): void {
    this.world.respawn();
    this.publishHud();
    this.resume();
  }

  formatTime(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')}`;
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent): void {
    if (event.code === 'Tab' && (this.status() !== 'playing' || !this.available)) {
      const dialog = this.stage.nativeElement.querySelector('.game-dialog');
      const buttons = dialog?.querySelectorAll<HTMLElement>('button, a[href]');
      if (buttons?.length) {
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (event.code === 'Escape' || event.code === 'KeyP') {
      if (!event.repeat && this.available) {
        event.preventDefault();
        this.status() === 'playing' ? this.pause() : this.resume();
      }
      return;
    }
    if (this.status() !== 'playing' || !this.available) return;
    if (event.code === 'KeyR') {
      event.preventDefault();
      if (!event.repeat) this.checkpoint();
      return;
    }
    const action = KEYS[event.code];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat && !this.held(action)) this.queue(action);
    this.keys.add(event.code);
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
    if (this.status() === 'playing' && KEYS[event.code]) event.preventDefault();
  }

  @HostListener('window:blur')
  @HostListener('document:visibilitychange')
  suspend(): void {
    this.pause();
  }

  pointerDown(event: PointerEvent, action: Action): void {
    if (this.status() !== 'playing') return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    if (!this.held(action)) this.queue(action);
    this.pointers.set(event.pointerId, action);
  }

  pointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
  }

  private held(action: Action): boolean {
    return (
      [...this.keys].some((key) => KEYS[key] === action) ||
      [...this.pointers.values()].includes(action)
    );
  }

  private queue(action: Action): void {
    if (action === 'jump') this.jumpQueued = true;
    if (action === 'attack') this.attackQueued = true;
  }

  private clearInput(): void {
    this.keys.clear();
    this.pointers.clear();
    this.jumpQueued = false;
    this.attackQueued = false;
  }

  private tick(time: number): void {
    if (this.destroyed) return;
    const delta = this.previousTime
      ? Math.max(0, Math.min((time - this.previousTime) / 1000, 0.05))
      : 0;
    this.previousTime = time;
    if (!this.available && this.status() === 'playing') this.zone.run(() => this.pause());
    if (this.status() === 'playing') {
      this.accumulator += delta;
      while (this.accumulator + 1e-9 >= STEP && !this.world.won) {
        const controls: Controls = {
          axis: Number(this.held('right')) - Number(this.held('left')),
          aim: Number(this.held('aimDown')) - Number(this.held('aimUp')),
          jump: this.jumpQueued,
          jumpHeld: this.held('jump'),
          attack: this.attackQueued,
        };
        this.world.step(STEP, controls);
        if (this.world.pickupEvents.length) {
          const events = this.world.pickupEvents.splice(0);
          this.zone.run(() => {
            this.fusionNames.set(
              [...this.world.fusions].map(
                (id) => COMPANION_ITEMS.find((item) => item.id === id)!.name,
              ),
            );
            for (const event of events) this.pickupCollected.emit(event);
          });
        }
        this.jumpQueued = false;
        this.attackQueued = false;
        this.accumulator -= STEP;
      }
      if (this.world.won) this.zone.run(() => this.finish());
      this.hudTime += delta;
      if (this.hudTime >= 0.1) {
        this.hudTime = 0;
        this.zone.run(() => this.publishHud());
      }
    } else {
      this.accumulator = 0;
    }
    this.render();
    this.frame = requestAnimationFrame((next) => this.tick(next));
  }

  private render(): void {
    if (!this.renderer) return;
    this.renderer.draw(this.world);
    const player = this.world.player;
    const scale = this.renderer.scale;
    const state = playerAnimation(this.world);
    const height = state.motion === 'idle' ? 75 : 77;
    const width = state.motion === 'idle' ? (height * 541) / 727 : height;
    const element = this.sprite.nativeElement;
    element.style.width = `${width * scale}px`;
    element.style.height = `${height * scale}px`;
    element.style.left = `${(player.x + player.w / 2 - this.renderer.camera - width / 2) * scale}px`;
    element.style.top = `${(player.y + player.h - height * (state.motion === 'idle' ? 698 / 727 : 180 / 192)) * scale}px`;
    element.style.transform = `scaleX(${player.facing})`;
    element.style.opacity =
      this.world.invulnerable > 0 && Math.floor(this.world.invulnerable * 12) % 2 ? '0.4' : '1';
    element.dataset['motion'] = state.motion;
    element.dataset['frame'] = String(state.frame);
    if (state.motion === 'idle') {
      element.style.removeProperty('background-image');
      element.style.removeProperty('background-position');
      element.style.removeProperty('animation');
      element.style.animationPlayState = this.status() === 'playing' ? 'running' : 'paused';
    } else {
      const skin = ['blue', 'pink', 'green', 'red', 'zebra'].includes(this.skin)
        ? this.skin
        : 'blue';
      const animation = state.motion === 'walk' ? 'walk' : 'attack';
      element.style.backgroundImage = `url("kenny/animations/${skin}-${animation}.png?v=2")`;
      element.style.backgroundPosition = `${(state.frame * 100) / 3}% 0`;
      element.style.animation = 'none';
    }
  }

  private publishHud(): void {
    this.hud.set({
      amber: this.world.amberCount,
      time: this.formatTime(this.world.elapsed),
      health: this.world.health,
      checkpoint: this.world.checkpoint,
      progress: this.world.progress,
      runes: this.world.runeProgress,
      deaths: this.world.deaths,
    });
    this.hint.set(this.world.hint);
  }

  private finish(): void {
    this.status.set('won');
    this.clearInput();
    this.publishHud();
    const previous = this.record();
    const record = { seconds: this.world.elapsed, amber: this.world.amberCount };
    if (!previous || record.seconds < previous.seconds) {
      this.record.set(record);
      try {
        localStorage.setItem(RECORD_KEY, JSON.stringify(record));
      } catch {
        // A blocked browser store must not interrupt a completed run.
      }
    }
    this.focusDialog();
  }

  private readRecord(): RecordTime | undefined {
    try {
      const record = JSON.parse(localStorage.getItem(RECORD_KEY) || 'null');
      if (
        record &&
        Number.isFinite(record.seconds) &&
        record.seconds > 0 &&
        Number.isInteger(record.amber) &&
        record.amber >= 0 &&
        record.amber <= 23
      )
        return record;
    } catch {
      // Local records are optional; no profile or wallet state is changed.
    }
    return undefined;
  }

  private focusDialog(): void {
    requestAnimationFrame(() => {
      if (!this.destroyed) this.dialogAction?.nativeElement.focus();
    });
  }
}
