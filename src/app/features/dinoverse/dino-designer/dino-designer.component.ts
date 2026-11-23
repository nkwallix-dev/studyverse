import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DinoSeasonState, kennyPortrait } from '../../../dino-season';
import { KennyRigPreviewComponent } from './kenny-rig-preview.component';

interface SkinChoice {
  id: string;
  name: string;
  icon: string;
  owned: boolean;
}

/** Pure presentation for the designer. The parent retains season and save logic. */
@Component({
  selector: 'app-dino-designer',
  standalone: true,
  imports: [CommonModule, KennyRigPreviewComponent],
  templateUrl: './dino-designer.component.html',
  styleUrl: './dino-designer.component.scss',
})
export class DinoDesignerComponent {
  @Input({ required: true }) kennySkin!: DinoSeasonState['skin'];
  @Input({ required: true }) kennyLevel!: number;
  @Input({ required: true }) kennyActive!: boolean;
  @Input({ required: true }) kennyAllSkinsOwned!: boolean;
  @Input({ required: true }) kennySkins: ReadonlyArray<SkinChoice> = [];

  @Output() readonly feedRequested = new EventEmitter<void>();
  @Output() readonly companionsRequested = new EventEmitter<void>();
  @Output() readonly skinSelected = new EventEmitter<string>();

  readonly kennyPortrait = kennyPortrait;
  view: 'designer' | 'test' = 'designer';
}
