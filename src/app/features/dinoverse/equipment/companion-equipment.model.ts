export type DinoSpecies = 'triceratops' | 'stegosaurus';
export type ItemId =
  'triceratops-horns' | 'triceratops-frill' | 'stegosaurus-plates' | 'stegosaurus-spikes';
export interface CompanionItem {
  id: ItemId;
  species: DinoSpecies;
  name: string;
  description: string;
  achievement: string;
  quip: string;
  icon: string;
  asset: string;
}
export const COMPANION_ITEMS: readonly CompanionItem[] = [
  {
    id: 'triceratops-horns',
    species: 'triceratops',
    name: 'Triceratops-Hörner',
    description: 'Hornstoß: stärkerer Angriff.',
    achievement: 'Mit dem Kopf durch die Wand',
    quip: '50 Hörner. Türen sind jetzt eher eine Empfehlung.',
    icon: '♜',
    asset: 'triceratops-horns',
  },
  {
    id: 'triceratops-frill',
    species: 'triceratops',
    name: 'Triceratops-Nackenschild',
    description: 'Frontschutz gegen anlaufende Gegner.',
    achievement: 'Kragenweite XXL',
    quip: '50 Nackenschilde. Der nächste Rollkragen wird teuer.',
    icon: '◈',
    asset: 'triceratops-frill',
  },
  {
    id: 'stegosaurus-plates',
    species: 'stegosaurus',
    name: 'Stegosaurus-Rückenplatten',
    description: 'Rückenschutz gegen Gegnerkontakt.',
    achievement: 'Plattenbau Deluxe',
    quip: '50 Rückenplatten. Kenny hat jetzt eine Dachterrasse.',
    icon: '▴',
    asset: 'stegosaurus-plates',
  },
  {
    id: 'stegosaurus-spikes',
    species: 'stegosaurus',
    name: 'Stegosaurus-Schwanzstacheln',
    description: 'Schwanzangriff: 0,25 Schaden pro Sekunde für 4 Sekunden.',
    achievement: 'Ganz schön stachelig!',
    quip: '50-mal Stacheln eingesammelt. Kenny besser nicht von hinten überraschen.',
    icon: '✧',
    asset: 'stegosaurus-spikes',
  },
];
export const isItem = (value: unknown): value is ItemId =>
  COMPANION_ITEMS.some((item) => item.id === value);
export interface CompanionState {
  version: 1;
  pickups: Record<string, ItemId>;
  equipped: ItemId | null;
  equippedAt: number;
  seen: ItemId[];
}
export function normalizeCompanions(raw: unknown): CompanionState {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<CompanionState>;
  const pickups: Record<string, ItemId> = {};
  for (const [id, item] of Object.entries(data.pickups || {})) {
    if (/^[a-zA-Z0-9_-]{1,100}$/.test(id) && isItem(item)) pickups[id] = item;
  }
  const state: CompanionState = {
    version: 1,
    pickups,
    equipped: isItem(data.equipped) ? data.equipped : null,
    equippedAt:
      Number.isSafeInteger(data.equippedAt) && data.equippedAt! > 0 ? data.equippedAt! : 0,
    seen: Array.isArray(data.seen) ? [...new Set(data.seen.filter(isItem))].sort() : [],
  };
  if (state.equipped && countItem(state, state.equipped) < 50) state.equipped = null;
  return state;
}
export const countItem = (state: CompanionState, item: ItemId): number =>
  Object.values(state.pickups).filter((value) => value === item).length;
export function mergeCompanions(a: unknown, b: unknown): CompanionState {
  const left = normalizeCompanions(a),
    right = normalizeCompanions(b);
  const chosen =
    left.equippedAt > right.equippedAt ||
    (left.equippedAt === right.equippedAt && (left.equipped || '') > (right.equipped || ''))
      ? left
      : right;
  return normalizeCompanions({
    ...chosen,
    pickups: { ...left.pickups, ...right.pickups },
    seen: [...left.seen, ...right.seen],
  });
}
export function recordPickup(raw: unknown, id: string, item: ItemId): CompanionState {
  const state = normalizeCompanions(raw);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id) || !isItem(item) || state.pickups[id]) return state;
  return { ...state, pickups: { ...state.pickups, [id]: item } };
}
export function equipCompanion(raw: unknown, item: ItemId | null): CompanionState {
  const state = normalizeCompanions(raw);
  if (item !== null && (!isItem(item) || countItem(state, item) < 50)) return state;
  return { ...state, equipped: item, equippedAt: Math.max(Date.now(), state.equippedAt + 1) };
}
export function dropsFor(
  species: DinoSpecies,
  tier: 'basic' | 'medium' | 'elite',
  random = Math.random,
): ItemId[] {
  const items = COMPANION_ITEMS.filter((item) => item.species === species).map((item) => item.id);
  return tier === 'basic'
    ? []
    : tier === 'elite'
      ? items
      : [items[Math.min(1, Math.max(0, Math.floor(random() * 2)))]];
}
