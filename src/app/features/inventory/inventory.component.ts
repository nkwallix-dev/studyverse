import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CosmeticArtComponent } from '../../cosmetic-art.component';
import type { ShopItem } from '../../shop-items';

export interface InventoryCard {
  item: ShopItem;
  equipped: boolean;
  collection: string;
  category: string;
  nameSuffix: string;
}

export interface InventoryOption { value: string; label: string; }

/** Inventory filters and cards; parent owns equipment, catalog and saved state. */
@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, CosmeticArtComponent],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss',
})
export class InventoryComponent {
  @Input({ required: true }) cards: ReadonlyArray<InventoryCard> = [];
  @Input({ required: true }) ownedItemCount = 0;
  @Input({ required: true }) dropOptions: ReadonlyArray<InventoryOption> = [];
  @Input({ required: true }) categoryOptions: ReadonlyArray<InventoryOption> = [];
  @Input({ required: true }) selectedDrop = 'Alle';
  @Input({ required: true }) selectedCategory = 'Alle';
  @Input({ required: true }) search = '';

  @Output() readonly dropChanged = new EventEmitter<string>();
  @Output() readonly categoryChanged = new EventEmitter<string>();
  @Output() readonly searchChanged = new EventEmitter<string>();
  @Output() readonly previewRequested = new EventEmitter<ShopItem>();
  @Output() readonly equipmentRequested = new EventEmitter<ShopItem>();
  @Output() readonly shopRequested = new EventEmitter<void>();
}
