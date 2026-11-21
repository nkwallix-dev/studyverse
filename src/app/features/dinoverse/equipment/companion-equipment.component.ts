import {
  COMPANION_SKILL_TREE,
  CompanionSkillNode,
  skillUnlocked,
  matchingSkill,
} from './companion-skill-tree';
import { KennyFusionPreviewComponent } from './kenny-fusion-preview.component';
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
  imports: [CommonModule, KennyFusionPreviewComponent],
  templateUrl: './companion-equipment.component.html',
  styleUrl: './companion-equipment.component.scss',
})
export class CompanionEquipmentComponent {
  @Input() showNavigation = true;
  @Input() popupOnly = false;
  @Input() state: CompanionState = normalizeCompanions(null);
  @Input() skin = 'blue';
  @Output() inventoryRequested = new EventEmitter<void>();
  @Output() playRequested = new EventEmitter<void>();
  @Output() equipRequested = new EventEmitter<{ item: ItemId | null; slot: ItemSlot }>();
  @Output() seenRequested = new EventEmitter<ItemId>();
  readonly items = COMPANION_ITEMS;
  readonly nodes = COMPANION_SKILL_TREE;
  // Equal-rank single items feed a complete species fusion and finally the hybrids.
  get stegoNodes(): readonly CompanionSkillNode[] {
    return this.nodes.filter((node) => node.family === 'stegosaurus' && node.tier === 1);
  }
  get trikeNodes(): readonly CompanionSkillNode[] {
    return this.nodes.filter((node) => node.family === 'triceratops' && node.tier === 1);
  }
  get fullStego(): CompanionSkillNode {
    return this.nodes.find((node) => node.id === 'full-stego')!;
  }
  get fullTrike(): CompanionSkillNode {
    return this.nodes.find((node) => node.id === 'full-trike')!;
  }
  get mixedNodes(): readonly CompanionSkillNode[] {
    return this.nodes.filter((node) => node.tier === 3);
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
  skinPortrait(): string {
    const selected = ['blue', 'pink', 'green', 'red', 'zebra'].includes(this.skin)
      ? this.skin
      : 'blue';
    return `kenny/skins/kenny-${selected}-portrait.png`;
  }
  dropArt(item: ItemId): string {
    return `kenny/hornweide/drops/${item}.${item === 'stegosaurus-spikes' ? 'svg' : 'png'}`;
  }
  kitArt(node: CompanionSkillNode): string {
    return node.needs.length ? this.dropArt(node.needs[0]) : this.skinPortrait();
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
