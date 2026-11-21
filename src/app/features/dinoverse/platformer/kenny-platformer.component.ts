import { BALANCE, playerSpecialDuration } from './kenny-platformer.balance';
import { playerAnimation } from './kenny-platformer.animation';
import { atlasPosition, fusionColumn, fusionRow } from './kenny-platformer.fusion';
import {
  ItemId,
  EquipmentSlots,
  COMPANION_ITEMS,
  CompanionState,
  normalizeCompanions,
} from '../equipment/companion-equipment.model';
import {
  COMPANION_SKILL_TREE,
  CompanionSkillNode,
  skillUnlocked,
  matchingSkill,
} from '../equipment/companion-skill-tree';
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
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Controls, KennyWorld, STEP } from './kenny-platformer.world';
import { KennyRenderer } from './kenny-platformer.renderer';
import { KennyFusionPreviewComponent } from '../equipment/kenny-fusion-preview.component';

type Action =
  'left' | 'right' | 'aimUp' | 'aimDown' | 'jump' | 'attack' | 'special' | 'interact' | 'drop';
type Status = 'ready' | 'playing' | 'paused' | 'won' | 'error' | 'tutorialComplete' | 'lost';
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
  KeyX: 'drop',
  ArrowDown: 'aimDown',
  KeyW: 'aimUp',
  ArrowUp: 'aimUp',
  Space: 'jump',
  KeyJ: 'attack',
  KeyL: 'special',
  KeyE: 'interact',
};

@Component({
  selector: 'app-kenny-platformer',
  imports: [CommonModule, KennyFusionPreviewComponent],
  templateUrl: './kenny-platformer.component.html',
  styleUrl: './kenny-platformer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KennyPlatformerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() skin = 'blue';
  @Input() startEquipment: EquipmentSlots = { offense: null, defense: null };
  @Input() companionState: CompanionState = normalizeCompanions(null);
  @Input() amberBalance = 0;
  @Input() claimedAmber: Record<string, true> = {};
  @Input() tutorialSeen = false;
  @Input() autoTutorial = false;
  @Output() tutorialAcknowledged = new EventEmitter<void>();
  @Output() amberCollected = new EventEmitter<string[]>();
  @Output() pickupCollected = new EventEmitter<{ id: string; item: ItemId }>();
  @Input() available = false;
  @Output() exitRequested = new EventEmitter<void>();
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expedition', { static: true }) expedition!: ElementRef<HTMLElement>;
  @ViewChild('sprite', { static: true }) sprite!: ElementRef<HTMLDivElement>;
  @ViewChild('fusionLayer', { static: true }) fusionLayer!: ElementRef<HTMLDivElement>;
  @ViewChild('stage', { static: true }) stage!: ElementRef<HTMLDivElement>;
  @ViewChild('dialogAction') dialogAction?: ElementRef<HTMLButtonElement>;

  readonly status = signal<Status>('ready');
  readonly assetsReady = signal(false);
  readonly settingsOpen = signal(false);
  readonly dropOnS = signal(this.readDropPreference());
  readonly starterPickerOpen = signal(false);
  readonly starterCustomizeOpen = signal(false);
  readonly starterKitId = signal('base');
  readonly skillNodes = COMPANION_SKILL_TREE;
  private chosenSlots: EquipmentSlots | null = null;
  isUnlocked(node: CompanionSkillNode): boolean {
    return skillUnlocked(this.companionState, node);
  }
  private readDropPreference(): boolean {
    try {
      return localStorage.getItem('kenny-drop-on-s-v1') === 'true';
    } catch {
      return false;
    }
  }
  setDropOnS(value: boolean): void {
    this.dropOnS.set(value);
    this.clearInput();
    try {
      localStorage.setItem('kenny-drop-on-s-v1', String(value));
    } catch {
      /* optional */
    }
  }
  openStarterPicker(): void {
    if (!this.available || !this.assetsReady()) return;
    const current = matchingSkill(this.startEquipment);
    this.starterKitId.set(skillUnlocked(this.companionState, current) ? current.id : 'base');
    this.starterCustomizeOpen.set(false);
    this.starterPickerOpen.set(true);
    requestAnimationFrame(() => {
      this.stage.nativeElement.querySelector<HTMLElement>('.starter-overlay button')?.focus();
    });
  }
  skinPortrait(): string {
    const selected = ['blue', 'pink', 'green', 'red', 'zebra'].includes(this.skin)
      ? this.skin
      : 'blue';
    return `kenny/skins/kenny-${selected}-portrait.png`;
  }
  dropArt(item: ItemId): string {
    return `kenny/hornweide/drops/${item}.${item === 'stegosaurus-spikes' ? 'svg' : 'png'}`;
  }
  selectedStarter(): CompanionSkillNode {
    return this.skillNodes.find((node) => node.id === this.starterKitId()) || this.skillNodes[0];
  }
  selectStarter(node: CompanionSkillNode): void {
    if (this.isUnlocked(node)) this.starterKitId.set(node.id);
  }
  launchSelectedStarter(): void {
    const node = this.selectedStarter();
    if (!this.isUnlocked(node)) return;
    this.chosenSlots = { ...node.slots };
    this.starterPickerOpen.set(false);
    this.starterCustomizeOpen.set(false);
    this.start();
  }
  private actionFor(code: string): Action | undefined {
    return code === 'KeyS' && this.dropOnS() ? 'drop' : KEYS[code];
  }
  readonly tutorialStep = signal(0);
  tutorialPromptHandled = false;
  tutorialActive = false;
  private tutorialDropPending = false;
  readonly tutorialSteps = [
    'Bewege Kenny mit A oder D.',
    'Drücke Space zum Springen.',
    'Mit W oder S richtest du den Angriff nach oben oder unten.',
    'Mit J beißt Kenny.',
    'Mit L benutzt Kenny seinen Spezialangriff. Danach gilt ein Cooldown.',
    'Vor dir liegt ein Item. Geh hin und drücke E zum Aufheben.',
  ] as const;
  readonly hud = signal({
    amber: 0,
    time: '0:00',
    health: 3,
    healthLabel: '3',
    fullHearts: '♥♥♥',
    emptyHearts: '',
    partialHeart: false,
    bleed: 0,
    stun: 0,
    checkpoint: 0,
    progress: 0,
    runes: 0,
    deaths: 0,
    shield: 0,
    shieldMaximum: 0,
    regeneration: 0,
    special: 'Sprungangriff',
    cooldown: 0,
    defense: 'Kein Schild',
    pickup: '',
    offense: null as ItemId | null,
    defenseItem: null as ItemId | null,
    shieldGlow: false,
  });
  readonly hint = signal('');
  readonly record = signal<RecordTime | undefined>(this.readRecord());
  readonly touchControls: { action: Action; label: string; symbol: string }[] = [
    { action: 'left', label: 'Nach links', symbol: '←' },
    { action: 'right', label: 'Nach rechts', symbol: '→' },
    { action: 'aimUp', label: 'Oben zielen', symbol: 'W' },
    { action: 'aimDown', label: 'Unten zielen', symbol: 'S' },
    { action: 'attack', label: 'Beißen', symbol: 'J' },
    { action: 'special', label: 'Spezial', symbol: 'L' },
    { action: 'interact', label: 'Aufheben', symbol: 'E' },
    { action: 'drop', label: 'Plattform verlassen', symbol: 'X' },
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
  private specialQueued = false;
  private interactQueued = false;
  private dropQueued = false;
  private destroyed = false;

  ngAfterViewInit(): void {
    try {
      this.renderer = new KennyRenderer(this.canvas.nativeElement);
      void Promise.all([this.renderer.ready, this.renderer.loadFusionAtlas(this.skin)])
        .then(() => {
          if (!this.destroyed)
            this.zone.run(() => {
              this.assetsReady.set(true);
              this.tryAutoTutorial();
            });
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['skin'] && this.renderer && this.assetsReady()) {
      // Profile skins may change without reconstructing the whole platformer.
      void this.renderer
        .loadFusionAtlas(this.skin)
        .then(() => {
          if (!this.destroyed) this.render();
        })
        .catch(() => {
          if (!this.destroyed) this.status.set('error');
        });
    }
    this.tryAutoTutorial();
  }

  private tryAutoTutorial(): void {
    if (
      this.autoTutorial &&
      this.available &&
      this.assetsReady() &&
      this.expedition &&
      !this.tutorialPromptHandled &&
      this.status() === 'ready'
    )
      this.startTutorial();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer?.disconnect();
    this.clearInput();
    if (document.fullscreenElement === this.expedition?.nativeElement)
      void document.exitFullscreen().catch(() => {});
  }

  private todayKey(): string {
    const now = new Date();
    // Use a stable Austrian local calendar day, irrespective of browser locale.
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Vienna',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const part = (type: string) => parts.find((value) => value.type === type)?.value || '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  start(): void {
    if (!this.available || !this.renderer || !this.assetsReady()) return;
    this.tutorialActive = false;
    this.tutorialDropPending = false;
    this.starterPickerOpen.set(false);
    this.starterCustomizeOpen.set(false);
    this.world = new KennyWorld(this.chosenSlots || this.startEquipment, {
      expedition: true,
      claimedAmber: this.claimedAmber,
      amberDay: this.todayKey(),
    });
    this.accumulator = 0;
    this.clearInput();
    this.publishHud();
    this.status.set('playing');
    this.enterFullscreen();
    requestAnimationFrame(() => {
      if (!this.destroyed) this.canvas.nativeElement.focus();
    });
  }

  chooseTutorial(play: boolean): void {
    this.tutorialPromptHandled = true;
    this.tutorialAcknowledged.emit();
    if (play) this.startTutorial();
    else this.openStarterPicker();
  }

  startTutorial(): void {
    if (!this.available || !this.renderer || !this.assetsReady()) return;
    this.settingsOpen.set(false);
    this.tutorialPromptHandled = true;
    this.tutorialActive = true;
    this.tutorialDropPending = false;
    this.tutorialStep.set(0);
    this.world = new KennyWorld();
    this.world.enemies.length = 0;
    // Tutorial pickups and amber never affect the real account.
    for (const amber of this.world.amber) amber.collected = true;
    this.accumulator = 0;
    this.clearInput();
    this.publishHud();
    this.status.set('playing');
    this.enterFullscreen();
    requestAnimationFrame(() => this.canvas.nativeElement.focus());
  }

  private advanceTutorial(input: Controls): void {
    if (!this.tutorialActive) return;
    const step = this.tutorialStep();
    const finished =
      (step === 0 && input.axis !== 0) ||
      (step === 1 && input.jump) ||
      (step === 2 && input.aim !== 0) ||
      (step === 3 && input.attack) ||
      (step === 4 && input.special);
    if (!finished) return;
    this.zone.run(() => this.tutorialStep.set(step + 1));
    if (step === 4) this.tutorialDropPending = true;
  }

  private enterFullscreen(): void {
    const root = this.expedition.nativeElement;
    if (typeof root.requestFullscreen === 'function' && !document.fullscreenElement) {
      void root.requestFullscreen().catch(() => {
        // The viewport-filling in-app view stays usable if native fullscreen is blocked.
      });
    }
  }

  close(): void {
    if (document.fullscreenElement === this.expedition.nativeElement)
      void document.exitFullscreen().catch(() => {});
    this.exitRequested.emit();
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

  formatTime(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0')}`;
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(event: KeyboardEvent): void {
    if (event.code === 'Tab' && (this.status() !== 'playing' || !this.available)) {
      const dialog = this.stage.nativeElement.querySelector(
        this.starterPickerOpen() ? '.starter-overlay' : '.game-dialog',
      );
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
    if (this.starterPickerOpen()) {
      if (event.code === 'Escape') {
        event.preventDefault();
        this.starterCustomizeOpen()
          ? this.starterCustomizeOpen.set(false)
          : this.starterPickerOpen.set(false);
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
    const action = this.actionFor(event.code);
    if (!action) return;
    event.preventDefault();
    if (!event.repeat && !this.held(action)) this.queue(action);
    this.keys.add(event.code);
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
    if (this.status() === 'playing' && this.actionFor(event.code)) event.preventDefault();
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
      [...this.keys].some((key) => this.actionFor(key) === action) ||
      [...this.pointers.values()].includes(action)
    );
  }

  private queue(action: Action): void {
    if (action === 'jump') this.jumpQueued = true;
    if (action === 'attack') this.attackQueued = true;
    if (action === 'special') this.specialQueued = true;
    if (action === 'interact') this.interactQueued = true;
    if (action === 'drop') this.dropQueued = true;
  }

  private clearInput(): void {
    this.keys.clear();
    this.pointers.clear();
    this.jumpQueued = false;
    this.attackQueued = false;
    this.specialQueued = false;
    this.interactQueued = false;
    this.dropQueued = false;
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
      while (this.accumulator + 1e-9 >= STEP && !this.world.won && !this.world.dead) {
        const controls: Controls = {
          axis: Number(this.held('right')) - Number(this.held('left')),
          aim: Number(this.held('aimDown')) - Number(this.held('aimUp')),
          jump: this.jumpQueued,
          jumpHeld: this.held('jump'),
          attack: this.attackQueued,
          special: this.specialQueued,
          interact: this.interactQueued,
          drop: this.dropQueued,
        };
        this.world.step(STEP, controls);
        this.advanceTutorial(controls);
        // Spawn the practice pickup only after the leap has finished, on the ground.
        if (this.tutorialDropPending && this.world.attackTime <= 0) {
          const player = this.world.player;
          this.world.loot.push({
            id: 'tutorial_sample',
            item: 'stegosaurus-plates',
            x: Math.max(25, player.x + 25),
            y: 420,
            w: 22,
            h: 22,
            collected: false,
          });
          this.tutorialDropPending = false;
        }
        if (this.world.pickupEvents.length) {
          const events = this.world.pickupEvents.splice(0);
          this.zone.run(() => {
            if (this.tutorialActive) {
              if (events.some((event) => event.id === 'tutorial_sample')) {
                this.tutorialActive = false;
                this.tutorialStep.set(this.tutorialSteps.length);
                this.status.set('tutorialComplete');
                this.clearInput();
              }
            } else {
              for (const event of events) this.pickupCollected.emit(event);
            }
          });
        }
        if (this.world.amberEvents.length) {
          const events = this.world.amberEvents.splice(0);
          this.zone.run(() => {
            if (!this.tutorialActive && this.status() !== 'tutorialComplete')
              this.amberCollected.emit(events);
          });
        }
        this.jumpQueued = false;
        this.attackQueued = false;
        this.specialQueued = false;
        this.interactQueued = false;
        this.dropQueued = false;
        this.accumulator -= STEP;
      }
      if (this.world.won && !this.tutorialActive) this.zone.run(() => this.finish());
      if (this.world.dead && !this.tutorialActive) this.zone.run(() => this.fail());
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
    const skin = ['blue', 'pink', 'green', 'red', 'zebra'].includes(this.skin) ? this.skin : 'blue';
    const outfitRow = fusionRow(this.world.offense, this.world.defense);
    const nativeFusion = outfitRow !== null && this.renderer.hasFusionAtlas(skin);
    const height = nativeFusion ? 88 : state.motion === 'idle' ? 75 : 77;
    const width = nativeFusion ? height : state.motion === 'idle' ? (height * 541) / 727 : height;
    const element = this.sprite.nativeElement;
    element.style.width = `${width * scale}px`;
    element.style.height = `${height * scale}px`;
    element.style.left = `${(player.x + player.w / 2 - width / 2 - this.renderer.camera) * scale}px`;
    const footRatio = nativeFusion ? 0.92 : state.motion === 'idle' ? 698 / 727 : 180 / 192;
    element.style.top = `${(player.y + player.h - height * footRatio) * scale}px`;
    const chargeWindup =
      this.world.attackTime > 0 &&
      this.world.attackKind === 'charge' &&
      playerSpecialDuration('charge') - this.world.attackTime < BALANCE.playerChargeWindup;
    element.style.transform = `scaleX(${player.facing})${chargeWindup ? ' rotate(10deg)' : ''}`;
    element.dataset['special'] = this.world.attackTime > 0 ? this.world.attackKind : '';
    element.style.opacity =
      this.world.invulnerable > 0 && Math.floor(this.world.invulnerable * 12) % 2 ? '0.4' : '1';
    element.dataset['motion'] = state.motion;
    element.dataset['frame'] = String(state.frame);
    element.dataset['fusionRow'] = nativeFusion ? String(outfitRow) : '';
    if (nativeFusion) {
      const pose = fusionColumn(this.world, state.motion);
      element.dataset['fusionPose'] = String(pose);
      element.style.backgroundImage = `url("kenny/animations/fusions/${skin}.png?v=3")`;
      element.style.backgroundSize = '800% 800%';
      element.style.backgroundPosition = atlasPosition(outfitRow, pose);
      element.style.backgroundRepeat = 'no-repeat';
      element.style.animation =
        this.world.defense === 'stegosaurus-plates' && this.world.shield < this.world.shieldMaximum
          ? 'kenny-native-plate-glow 1.2s ease-in-out infinite alternate'
          : 'none';
    } else if (state.motion === 'idle') {
      element.dataset['fusionPose'] = '';
      element.style.removeProperty('background-image');
      element.style.removeProperty('background-position');
      element.style.removeProperty('background-size');
      element.style.removeProperty('background-repeat');
      element.style.removeProperty('animation');
      element.style.animationPlayState = this.status() === 'playing' ? 'running' : 'paused';
    } else {
      element.dataset['fusionPose'] = '';
      const animation = state.motion === 'walk' || this.world.biteTime > 0 ? 'walk' : 'attack';
      element.style.backgroundImage = `url("kenny/animations/${skin}-${animation}.png?v=2")`;
      element.style.backgroundPosition = `${(state.frame * 100) / 3}% 0`;
      element.style.backgroundSize = '400% 100%';
      element.style.backgroundRepeat = 'no-repeat';
      element.style.animation = 'none';
    }
    element.dataset['bite'] =
      this.world.biteTime > 0
        ? this.world.biteAim < 0
          ? 'up'
          : this.world.biteAim > 0
            ? 'down'
            : 'front'
        : 'off';
    element.classList.toggle(
      'plates-regenerating',
      this.world.defense === 'stegosaurus-plates' && this.world.shield < this.world.shieldMaximum,
    );
    const fusion = this.fusionLayer.nativeElement;
    fusion.style.left = element.style.left;
    fusion.style.top = element.style.top;
    fusion.style.width = element.style.width;
    fusion.style.height = element.style.height;
    fusion.style.transform = `scaleX(${player.facing})`;
    fusion.dataset['offense'] = this.world.offense || '';
    fusion.dataset['defense'] = this.world.defense || '';
    fusion.dataset['bite'] = element.dataset['bite'];
    fusion.dataset['nativeAtlas'] = nativeFusion ? 'true' : 'false';
    fusion.classList.toggle(
      'plates-regenerating',
      element.classList.contains('plates-regenerating'),
    );
  }

  private publishHud(): void {
    this.hud.set({
      amber: this.world.amberCount,
      time: this.formatTime(this.world.elapsed),
      health: this.world.health,
      healthLabel: Number(this.world.health.toFixed(2)).toString(),
      fullHearts: '♥'.repeat(Math.floor(this.world.health)),
      emptyHearts: '♡'.repeat(3 - Math.ceil(this.world.health)),
      partialHeart: this.world.health % 1 > 0,
      bleed: Math.ceil(this.world.bleedRemaining * 10) / 10,
      stun: Math.ceil(this.world.playerStun * 10) / 10,
      checkpoint: this.world.checkpoint,
      progress: this.world.progress,
      runes: this.world.runeProgress,
      deaths: this.world.deaths,
      shield: this.world.shield,
      shieldMaximum: this.world.shieldMaximum,
      regeneration:
        this.world.defense === 'stegosaurus-plates' && !this.world.shield
          ? Math.max(0, Math.ceil(BALANCE.shield.regeneration - this.world.sinceDamage))
          : 0,
      special:
        this.world.specialKind === 'leap'
          ? 'Sprungangriff'
          : this.world.specialKind === 'tail'
            ? 'Schwanzschlag'
            : 'Triceratops-Charge',
      cooldown: Math.ceil(this.world.specialCooldown * 10) / 10,
      defense: this.world.defense
        ? COMPANION_ITEMS.find((item) => item.id === this.world.defense)!.name
        : 'Kein Schild',
      offense: this.world.offense,
      defenseItem: this.world.defense,
      shieldGlow:
        this.world.defense === 'stegosaurus-plates' &&
        (this.world.shield < this.world.shieldMaximum ||
          this.world.sinceDamage < BALANCE.shield.regeneration),
      pickup: this.world.nearbyDrop
        ? COMPANION_ITEMS.find((item) => item.id === this.world.nearbyDrop!.item)!.name
        : '',
    });
    this.hint.set(this.world.hint);
  }

  private fail(): void {
    if (this.status() === 'lost') return;
    this.status.set('lost');
    this.clearInput();
    this.publishHud();
    this.focusDialog();
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
