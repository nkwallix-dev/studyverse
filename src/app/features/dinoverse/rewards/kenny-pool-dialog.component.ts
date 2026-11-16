import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CosmeticIconComponent } from '../../../cosmetic-icon.component';
import type { ShopItem } from '../../../shop-items';
import type { KennyPoolTier, KennyPrizeOdds } from './kenny-rewards.model';

/** The existing prize popup, without season calculations or inventory mutations. */
@Component({
  selector: 'app-kenny-pool-dialog',
  standalone: true,
  imports: [CommonModule, CosmeticIconComponent],
  templateUrl: './kenny-pool-dialog.component.html',
  styleUrl: './kenny-pool-dialog.component.scss',
})
export class KennyPoolDialogComponent {
  @Input({ required: true }) kennyLevel!: number;
  @Input({ required: true }) kennyOdds!: KennyPrizeOdds;
  @Input({ required: true }) kennyPoolPreview: ReadonlyArray<KennyPoolTier> = [];
  @Input({ required: true }) kennyRegularExclusivesComplete!: boolean;
  @Input({ required: true }) ownedEventIds: ReadonlyArray<string> = [];
  @Output() readonly closeRequested = new EventEmitter<void>();

  isOwned(item: ShopItem): boolean {
    return this.ownedEventIds.includes(item.id);
  }
}
