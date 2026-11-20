import {
  COMPANION_SKILL_TREE,
  CompanionSkillNode,
  skillUnlocked,
  matchingSkill,
} from './companion-skill-tree';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  COMPANION_ITEMS,
  CompanionState,
  ItemId,
  ItemSlot,
  itemSlot,
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
  @Input() showNavigation = true;
  @Input() popupOnly = false;
  @Input() state: CompanionState = normalizeCompanions(null);
  @Output() inventoryRequested = new EventEmitter<void>();
  @Output() playRequested = new EventEmitter<void>();
  @Output() equipRequested = new EventEmitter<{ item: ItemId | null; slot: ItemSlot }>();
  @Output() seenRequested = new EventEmitter<ItemId>();
  readonly items = COMPANION_ITEMS;
  readonly nodes = COMPANION_SKILL_TREE;
  get stegoNodes(): readonly CompanionSkillNode[] {
    return this.nodes.filter((node) => node.family === 'stegosaurus');
  }
  get trikeNodes(): readonly CompanionSkillNode[] {
    return this.nodes.filter((node) => node.family === 'triceratops');
  }
  isUnlocked(node: CompanionSkillNode): boolean {
    return skillUnlocked(this.state, node);
  }
  isSelected(node: CompanionSkillNode): boolean {
    return matchingSkill(this.state.equippedSlots).id === node.id;
  }
  chooseKit(node: CompanionSkillNode): void {
    if (!this.isUnlocked(node)) return;
    // Persist each slot independently with the same existing cloud/achievement system.
    this.equipRequested.emit({ item: node.slots.offense, slot: 'offense' });
    this.equipRequested.emit({ item: node.slots.defense, slot: 'defense' });
  }
  kitArt(node: CompanionSkillNode): string {
    return node.needs.length
      ? 'kenny/hornweide/drops/' + node.needs[0] + '.png'
      : 'kenny/skins/kenny-blue-portrait.png';
  }
  get visibleItems() {
    return this.tab === 'inventory'
      ? this.items.filter((item) => this.count(item.id) >= 50)
      : this.items;
  }
  isEquipped(id: ItemId): boolean {
    return this.state.equippedSlots[itemSlot(id)] === id;
  }
  equip(id: ItemId): void {
    this.equipRequested.emit({ item: this.isEquipped(id) ? null : id, slot: itemSlot(id) });
  }
  slotName(id: ItemId): string {
    return itemSlot(id) === 'offense' ? 'Offensiv · L' : 'Defensiv · Schild';
  }
  @Input() tab: 'inventory' | 'achievements' = 'inventory';
  count(id: ItemId): number {
    return countItem(this.state, id);
  }
  get pending() {
    return this.items.find(
      (item) => this.count(item.id) >= 50 && !this.state.seen.includes(item.id),
    );
  }
  accept(id: ItemId, inventory = false): void {
    if (inventory) {
      this.tab = 'inventory';
      if (this.popupOnly || !this.showNavigation) this.inventoryRequested.emit();
    }
    this.seenRequested.emit(id);
  }
}
