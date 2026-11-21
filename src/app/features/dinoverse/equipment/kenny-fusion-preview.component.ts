import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import type { ItemId } from './companion-equipment.model';
import { fusionRow } from '../platformer/kenny-platformer.fusion';
import {
  drawKennyFusionCell,
  loadKennyFusionAtlas,
  normalizedKennySkin,
} from '../platformer/kenny-fusion-frame';

/** True Kenny+gear illustrations directly from the already shipped full-fusion atlases. */
@Component({
  selector: 'app-kenny-fusion-preview',
  standalone: true,
  template: `
    <canvas #portrait [style.display]="hasFusion ? 'block' : 'none'" aria-hidden="true"></canvas>
    <img [style.display]="hasFusion ? 'none' : 'block'" [src]="basePortrait" alt="" aria-hidden="true" />
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; min-width: 0; }
    canvas, img { display: block; width: 100%; height: 100%; object-fit: contain; }
  `],
})
export class KennyFusionPreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() skin = 'blue';
  @Input() offense: ItemId | null = null;
  @Input() defense: ItemId | null = null;
  @ViewChild('portrait') portrait!: ElementRef<HTMLCanvasElement>;
  private viewReady = false;
  private renderSerial = 0;

  get hasFusion(): boolean {
    return fusionRow(this.offense, this.defense) !== null;
  }
  get basePortrait(): string {
    return `kenny/skins/kenny-${normalizedKennySkin(this.skin)}-portrait.png`;
  }
  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.render();
  }
  ngOnChanges(): void {
    void this.render();
  }
  ngOnDestroy(): void {
    this.renderSerial++;
  }

  private async render(): Promise<void> {
    if (!this.viewReady || !this.hasFusion) return;
    const serial = ++this.renderSerial;
    const row = fusionRow(this.offense, this.defense);
    if (row === null) return;
    try {
      const atlas = await loadKennyFusionAtlas(this.skin);
      if (this.renderSerial !== serial) return;
      drawKennyFusionCell(this.portrait.nativeElement, atlas, row, 0);
    } catch {
      // The rest of the UI remains usable even if an atlas failed to download.
      if (this.renderSerial === serial) {
        const ctx = this.portrait.nativeElement.getContext('2d');
        ctx?.clearRect(0, 0, this.portrait.nativeElement.width, this.portrait.nativeElement.height);
      }
    }
  }
}
