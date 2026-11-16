import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CosmeticIconComponent } from '../../../cosmetic-icon.component';
import type { ShopItem } from '../../../shop-items';
import type { KennyPrizeOdds } from './kenny-rewards.model';

/** Season prize tiles. Ownership and odds arrive from the existing parent selectors. */
@Component({
  selector: 'app-kenny-reward-overview',
  standalone: true,
  imports: [CommonModule, CosmeticIconComponent],
  templateUrl: './kenny-reward-overview.component.html',
  styleUrl: './kenny-reward-overview.component.scss',
})
export class KennyRewardOverviewComponent {
  @Input({ required: true }) kennyLevel!: number;
  @Input({ required: true }) kennyOdds!: KennyPrizeOdds;
  @Input({ required: true }) kennyEventItems: ReadonlyArray<ShopItem> = [];
  @Input({ required: true }) ownedEventIds: ReadonlyArray<string> = [];
  @Output() readonly prizesRequested = new EventEmitter<void>();

  isOwned(item: ShopItem): boolean { return this.ownedEventIds.includes(item.id); }
}
