import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  COMPANION_ITEMS,
  CompanionState,
  ItemId,
  countItem,
  normalizeCompanions,
} from './companion-equipment.model';
@Component({
  selector: 'app-companion-equipment',
  imports: [CommonModule],
  templateUrl: './companion-equipment.component.html',
  styleUrl: './companion-equipment.component.scss',
})
export class CompanionEquipmentComponent {
  @Input() state: CompanionState = normalizeCompanions(null);
  @Output() playRequested = new EventEmitter<void>();
  @Output() equipRequested = new EventEmitter<ItemId | null>();
  @Output() seenRequested = new EventEmitter<ItemId>();
  readonly items = COMPANION_ITEMS;
  tab: 'inventory' | 'achievements' = 'inventory';
  count(id: ItemId): number {
    return countItem(this.state, id);
  }
  get pending() {
    return this.items.find(
      (item) => this.count(item.id) >= 50 && !this.state.seen.includes(item.id),
    );
  }
  accept(id: ItemId, inventory = false): void {
    if (inventory) this.tab = 'inventory';
    this.seenRequested.emit(id);
  }
}
