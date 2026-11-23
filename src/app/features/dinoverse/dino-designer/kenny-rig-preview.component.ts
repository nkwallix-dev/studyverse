import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  KENNY_RIG_BONES,
  KENNY_RIG_FPS,
  KennyRigPose,
  kennyIdlePose,
  paletteForSkin,
  rotateBone,
} from './kenny-rig.model';

/** Standalone master-rig animation sandbox. Does not equip skins, write state, or alter gameplay. */
@Component({
  selector: 'app-kenny-rig-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kenny-rig-preview.component.html',
  styleUrl: './kenny-rig-preview.component.scss',
})
export class KennyRigPreviewComponent implements OnInit, OnDestroy {
  @Input() set skin(value: string) {
    if (!this.skinOverridden) this.currentSkin = value || 'blue';
  }
  currentSkin = 'blue';
  skinOverridden = false;
  readonly skinOptions = [
    { id: 'blue', name: 'Blau' },
    { id: 'pink', name: 'Pink' },
    { id: 'green', name: 'Grün' },
    { id: 'red', name: 'Rot' },
    { id: 'zebra', name: 'Weiß' },
  ];
  readonly bones = KENNY_RIG_BONES;
  readonly fps = KENNY_RIG_FPS;
  playing = true;
  showBones = false;
  frame = 0;
  pose: KennyRigPose = kennyIdlePose(0);
  private clock?: ReturnType<typeof setInterval>;
  get palette() {
    return paletteForSkin(this.currentSkin);
  }
  get headTransform() {
    return `translate(0 ${-this.pose.neckLift}) ${rotateBone(430, 196, this.pose.head)}`;
  }
  get jawTransform() {
    return rotateBone(485, 230, this.pose.jaw);
  }
  get tailTransform() {
    return rotateBone(252, 378, this.pose.tail);
  }
  get tailTipTransform() {
    return rotateBone(114, 420, this.pose.tailTip);
  }
  get nearArmTransform() {
    return rotateBone(385, 335, this.pose.nearArm);
  }
  get farArmTransform() {
    return rotateBone(454, 344, this.pose.farArm);
  }
  get nearLegTransform() {
    return rotateBone(316, 423, this.pose.nearLeg);
  }
  get farLegTransform() {
    return rotateBone(430, 423, this.pose.farLeg);
  }
  ngOnInit(): void {
    // A 10 Hz authoring timeline, independent from platformer physics/render FPS.
    this.clock = setInterval(() => {
      if (this.playing) this.setFrame(this.frame + 1);
    }, 1000 / KENNY_RIG_FPS);
  }
  ngOnDestroy(): void {
    if (this.clock) clearInterval(this.clock);
  }
  setFrame(value: number): void {
    this.frame = ((Math.floor(Number(value) || 0) % 64) + 64) % 64;
    this.pose = kennyIdlePose(this.frame);
  }
  chooseSkin(skin: string): void {
    this.currentSkin = skin;
    this.skinOverridden = true;
  }
  step(by: number): void {
    this.playing = false;
    this.setFrame(this.frame + by);
  }
  togglePlay(): void {
    this.playing = !this.playing;
  }
}
