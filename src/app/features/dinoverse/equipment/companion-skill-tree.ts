import { CompanionState, EquipmentSlots, ItemId, countItem } from './companion-equipment.model';

export interface CompanionSkillNode {
  id: string;
  title: string;
  subtitle: string;
  family: 'base' | 'stegosaurus' | 'triceratops';
  tier: number;
  slots: EquipmentSlots;
  needs: readonly ItemId[];
}
const kit = (
  id: string,
  title: string,
  family: CompanionSkillNode['family'],
  tier: number,
  offense: ItemId | null = null,
  defense: ItemId | null = null,
): CompanionSkillNode => ({
  id,
  title,
  family,
  tier,
  subtitle: family === 'base' ? 'Von Anfang an verfügbar' : '50 Pickups pro benötigtem Item',
  slots: { offense, defense },
  needs: [offense, defense].filter((item): item is ItemId => item !== null),
});
export const COMPANION_SKILL_TREE: readonly CompanionSkillNode[] = [
  kit('base', 'Kenny · Basis', 'base', 0),
  kit('stego-plates', 'Kenny · Rückenplatten', 'stegosaurus', 1, null, 'stegosaurus-plates'),
  kit('trike-horns', 'Kenny · Hörner', 'triceratops', 1, 'triceratops-horns'),
  kit('stego-spikes', 'Kenny · Schwanzstacheln', 'stegosaurus', 2, 'stegosaurus-spikes'),
  kit('trike-frill', 'Kenny · Nackenschild', 'triceratops', 2, null, 'triceratops-frill'),
  kit(
    'full-stego',
    'Kompletter Stegosaurus',
    'stegosaurus',
    3,
    'stegosaurus-spikes',
    'stegosaurus-plates',
  ),
  kit(
    'full-trike',
    'Kompletter Triceratops',
    'triceratops',
    3,
    'triceratops-horns',
    'triceratops-frill',
  ),
  kit(
    'horns-plates',
    'Hörner + Rückenplatten',
    'stegosaurus',
    4,
    'triceratops-horns',
    'stegosaurus-plates',
  ),
  kit(
    'spikes-frill',
    'Stacheln + Nackenschild',
    'triceratops',
    4,
    'stegosaurus-spikes',
    'triceratops-frill',
  ),
];
export function skillUnlocked(state: CompanionState, node: CompanionSkillNode): boolean {
  return node.needs.every((item) => countItem(state, item) >= 50);
}
export function matchingSkill(slots: EquipmentSlots): CompanionSkillNode {
  return (
    COMPANION_SKILL_TREE.find(
      (node) => node.slots.offense === slots.offense && node.slots.defense === slots.defense,
    ) || COMPANION_SKILL_TREE[0]
  );
}
