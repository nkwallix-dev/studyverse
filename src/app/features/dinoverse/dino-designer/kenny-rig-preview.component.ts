import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import {
  KENNY_RIG_BONES,
  KENNY_RIG_FPS,
  KennyRigPose,
  kennyIdlePose,
  paletteForSkin,
} from './kenny-rig.model';

interface KennyPart {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pivotX: number;
  pivotY: number;
}

interface KennyPartManifest {
  version: number;
  width: number;
  height: number;
  fps: number;
  parts: KennyPart[];
  extraParts: KennyPart[];
}

/** Approved Kenny artwork, split into independently rotatable transparent PNG layers. */
@Component({
  selector: 'app-kenny-rig-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kenny-rig-preview.component.html',
  styleUrl: './kenny-rig-preview.component.scss',
})
export class KennyRigPreviewComponent implements OnInit, OnDestroy {
  @Input() set skin(value: string) {
    if (!this.skinOverridden && value) void this.chooseSkin(value, false);
  }

  private readonly changeDetector = inject(ChangeDetectorRef);
  readonly skinOptions = [
    { id: 'blue', name: 'Blau' },
    { id: 'pink', name: 'Pink' },
    { id: 'green', name: 'Grün' },
    { id: 'red', name: 'Rot' },
    { id: 'zebra', name: 'Weiß' },
  ];
  readonly bones = KENNY_RIG_BONES;
  readonly fps = KENNY_RIG_FPS;
  readonly fallback = new URL('kenny/rig/v1/source/kenny-approved-master.png', document.baseURI)
    .href;

  currentSkin = 'blue';
  skinOverridden = false;
  playing = true;
  showBones = false;
  frame = 0;
  pose: KennyRigPose = kennyIdlePose(0);
  imageError = '';
  isReady = false;
  parts: KennyPart[] = [];
  eyelid?: KennyPart;
  private requestedSkin = 'blue';
  private clock?: ReturnType<typeof setInterval>;
  private disposed = false;

  // Composition order: far side -> core -> face -> near side.
  private readonly order = [
    'tail_tip',
    'tail_mid',
    'tail_base',
    'thigh_far',
    'shin_far',
    'foot_far',
    'torso_core',
    'neck',
    'head_upper',
    'jaw_lower',
    'eye_open',
    'arm_far',
    'hand_far',
    'thigh_near',
    'shin_near',
    'foot_near',
    'arm_near',
    'hand_near',
  ];

  get orderedParts(): KennyPart[] {
    const byId = new Map(this.parts.map((p) => [p.id, p]));
    return this.order.map((id) => byId.get(id)).filter((x): x is KennyPart => !!x);
  }

  get palette() {
    return paletteForSkin(this.currentSkin);
  }

  get isBlinking(): boolean {
    return this.pose.blink < 0.5;
  }

  ngOnInit(): void {
    void this.loadParts();
    // Graphic FPS deliberately independent of the platformer's physics clock.
    this.clock = setInterval(() => {
      if (this.playing && this.isReady) this.setFrame(this.frame + 1);
    }, 1000 / KENNY_RIG_FPS);
  }

  ngOnDestroy(): void {
    this.disposed = true;
    if (this.clock) clearInterval(this.clock);
  }

  private async loadParts(): Promise<void> {
    try {
      const url = new URL('kenny/rig/v1/manifest.json', document.baseURI).href;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Manifest HTTP ${response.status}`);
      const manifest = (await response.json()) as KennyPartManifest;
      if (manifest.width !== 1205 || manifest.height !== 1305 || manifest.fps !== 10)
        throw new Error('Invalid PNG rig manifest geometry');
      this.parts = manifest.parts;
      this.changeDetector.markForCheck();
      this.eyelid = manifest.extraParts.find((part) => part.id === 'eye_closed');
      if (!this.eyelid || this.parts.length < 17) throw new Error('PNG rig parts incomplete');
      await this.chooseSkin(this.requestedSkin, false);
    } catch (error) {
      if (!this.disposed) {
        this.imageError = String(error);
        this.changeDetector.markForCheck();
      }
    }
  }

  private renderSkin(skin: string): string {
    return skin === 'zebra' || skin === 'white' ? 'white' : skin;
  }

  imageUrl(id: string): string {
    return new URL(
      `kenny/rig/v1/parts/${this.renderSkin(this.currentSkin)}/${id}.png`,
      document.baseURI,
    ).href;
  }

  async chooseSkin(skin: string, override = true): Promise<void> {
    if (!this.skinOptions.some((option) => option.id === skin)) return;
    if (override) this.skinOverridden = true;
    this.requestedSkin = skin;
    if (!this.parts.length) {
      this.currentSkin = skin;
      this.changeDetector.markForCheck();
      return;
    }
    this.imageError = '';
    const urls = this.parts.map(
      (part) =>
        new URL(`kenny/rig/v1/parts/${this.renderSkin(skin)}/${part.id}.png`, document.baseURI)
          .href,
    );
    urls.push(
      new URL(`kenny/rig/v1/parts/${this.renderSkin(skin)}/eye_closed.png`, document.baseURI).href,
      new URL(`kenny/rig/v1/parts/${this.renderSkin(skin)}/seam_underlay.png`, document.baseURI)
        .href,
    );
    try {
      await Promise.all(
        urls.map(
          (url) =>
            new Promise<void>((resolve, reject) => {
              const image = new Image();
              image.onload = () => resolve();
              image.onerror = () => reject(new Error(`Bild konnte nicht geladen werden: ${url}`));
              image.src = url;
            }),
        ),
      );
      if (this.disposed || this.requestedSkin !== skin) return;
      this.currentSkin = skin;
      this.isReady = true;
      this.changeDetector.markForCheck();
    } catch (error) {
      if (!this.disposed && this.requestedSkin === skin) {
        this.imageError = String(error);
        this.changeDetector.markForCheck();
      }
    }
  }

  layerTransform(id: string): string {
    const rotate = (degrees: number, x: number, y: number) =>
      `rotate(${degrees.toFixed(3)} ${x} ${y})`;
    // Deliberately subtle initial motions until all seams are artist-approved.
    const head = this.pose.head * 0.19;
    const jaw = this.pose.jaw * 0.16;
    const tail = this.pose.tail * 0.15;
    const tailTip = (this.pose.tailTip - kennyIdlePose(0).tailTip) * 0.13;
    const nearArm = this.pose.nearArm * 0.16;
    const farArm = (this.pose.farArm - kennyIdlePose(0).farArm) * 0.15;
    if (id === 'tail_base') return rotate(tail, 584, 704);
    if (id === 'tail_mid') return `${rotate(tail, 584, 704)} ${rotate(tailTip * 0.5, 396, 658)}`;
    if (id === 'tail_tip')
      return `${rotate(tail, 584, 704)} ${rotate(tailTip * 0.5, 396, 658)} ${rotate(tailTip, 197, 552)}`;
    if (id === 'neck') return rotate(head * 0.4, 729, 623);
    if (id === 'head_upper' || id === 'eye_open' || id === 'eye_closed')
      return rotate(head, 699, 437);
    if (id === 'jaw_lower') return `${rotate(head, 699, 437)} ${rotate(jaw, 756, 380)}`;
    if (id === 'arm_near') return rotate(nearArm, 631, 682);
    if (id === 'hand_near')
      return `${rotate(nearArm, 631, 682)} ${rotate(nearArm * 0.4, 724, 723)}`;
    if (id === 'arm_far') return rotate(farArm, 849, 690);
    if (id === 'hand_far') return `${rotate(farArm, 849, 690)} ${rotate(farArm * 0.4, 896, 716)}`;
    return '';
  }

  setFrame(value: number): void {
    this.frame = ((Math.floor(Number(value) || 0) % 64) + 64) % 64;
    this.pose = kennyIdlePose(this.frame);
    this.changeDetector.markForCheck();
  }

  step(by: number): void {
    this.playing = false;
    this.setFrame(this.frame + by);
  }

  togglePlay(): void {
    this.playing = !this.playing;
    this.changeDetector.markForCheck();
  }
}
