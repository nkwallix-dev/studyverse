export type DinoSpecies = 'triceratops' | 'stegosaurus';
export type ItemId =
  'triceratops-horns' | 'triceratops-frill' | 'stegosaurus-plates' | 'stegosaurus-spikes';
export type ItemSlot = 'offense' | 'defense';
export type EquipmentSlots = Record<ItemSlot, ItemId | null>;
export const itemSlot = (id: ItemId): ItemSlot =>
  id === 'triceratops-horns' || id === 'stegosaurus-spikes' ? 'offense' : 'defense';
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
    description: 'L: 2 Sekunden aufladen, dann 4 Felder vorstürmen. 2 Schaden.',
    achievement: 'Mit dem Kopf durch die Wand',
    quip: '50 Hörner. Türen sind jetzt eher eine Empfehlung.',
    icon: '♜',
    asset: 'triceratops-horns',
  },
  {
    id: 'triceratops-frill',
    species: 'triceratops',
    name: 'Triceratops-Nackenschild',
    description: '2 einmalige Schildherzen. Verbraucht sich bei vollständigem Schildverlust.',
    achievement: 'Kragenweite XXL',
    quip: '50 Nackenschilde. Der nächste Rollkragen wird teuer.',
    icon: '◈',
    asset: 'triceratops-frill',
  },
  {
    id: 'stegosaurus-plates',
    species: 'stegosaurus',
    name: 'Stegosaurus-Rückenplatten',
    description: '1 Schildherz. Regeneriert nach 8 schadensfreien Sekunden.',
    achievement: 'Plattenbau Deluxe',
    quip: '50 Rückenplatten. Kenny hat jetzt eine Dachterrasse.',
    icon: '▴',
    asset: 'stegosaurus-plates',
  },
  {
    id: 'stegosaurus-spikes',
    species: 'stegosaurus',
    name: 'Stegosaurus-Schwanzstacheln',
    description:
      'L: Schwanzschlag mit Reichweite 3 und 1 Schaden; danach 0,25 Schaden/s für 4 Sekunden.',
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
  amberPickups: Record<string, true>;
  equippedSlots: EquipmentSlots;
  slotUpdatedAt: Record<ItemSlot, number>;
  /** Compatibility mirror for saves from the former single-slot inventory. */
  equipped: ItemId | null;
  equippedAt: number;
  seen: ItemId[];
}
const validReceipt = (id: string): boolean => /^[a-zA-Z0-9_-]{1,100}$/.test(id);
const stamp = (value: unknown): number =>
  Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : 0;
export const countItem = (state: CompanionState, item: ItemId): number =>
  Object.values(state.pickups).filter((value) => value === item).length;
export const amberTotal = (state: CompanionState): number => Object.keys(state.amberPickups).length;
export function normalizeCompanions(raw: unknown): CompanionState {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<CompanionState>;
  const pickups: Record<string, ItemId> = {},
    amberPickups: Record<string, true> = {};
  for (const [id, item] of Object.entries(data.pickups || {}))
    if (validReceipt(id) && isItem(item)) pickups[id] = item;
  for (const [id, value] of Object.entries(data.amberPickups || {}))
    if (validReceipt(id) && value === true) amberPickups[id] = true;
  const slots: EquipmentSlots = { offense: null, defense: null };
  const times = { offense: 0, defense: 0 };
  const legacy = isItem(data.equipped) ? data.equipped : null;
  const hasSlots = !!data.equippedSlots && typeof data.equippedSlots === 'object';
  for (const slot of ['offense', 'defense'] as const) {
    const value = hasSlots
      ? data.equippedSlots?.[slot]
      : legacy && itemSlot(legacy) === slot
        ? legacy
        : null;
    if (
      isItem(value) &&
      itemSlot(value) === slot &&
      Object.values(pickups).filter((id) => id === value).length >= 50
    )
      slots[slot] = value;
    times[slot] = hasSlots
      ? stamp(data.slotUpdatedAt?.[slot])
      : legacy && itemSlot(legacy) === slot
        ? stamp(data.equippedAt)
        : 0;
  }
  const recent = times.offense >= times.defense ? 'offense' : 'defense';
  return {
    version: 1,
    pickups,
    amberPickups,
    equippedSlots: slots,
    slotUpdatedAt: times,
    equipped: slots[recent] || slots[recent === 'offense' ? 'defense' : 'offense'],
    equippedAt: Math.max(times.offense, times.defense),
    seen: Array.isArray(data.seen) ? [...new Set(data.seen.filter(isItem))].sort() : [],
  };
}
export function mergeCompanions(a: unknown, b: unknown): CompanionState {
  const left = normalizeCompanions(a),
    right = normalizeCompanions(b);
  const slots: EquipmentSlots = { offense: null, defense: null },
    times = { offense: 0, defense: 0 };
  for (const slot of ['offense', 'defense'] as const) {
    const chosen =
      left.slotUpdatedAt[slot] > right.slotUpdatedAt[slot] ||
      (left.slotUpdatedAt[slot] === right.slotUpdatedAt[slot] &&
        (left.equippedSlots[slot] || '') > (right.equippedSlots[slot] || ''))
        ? left
        : right;
    slots[slot] = chosen.equippedSlots[slot];
    times[slot] = chosen.slotUpdatedAt[slot];
  }
  return normalizeCompanions({
    equippedSlots: slots,
    slotUpdatedAt: times,
    pickups: { ...left.pickups, ...right.pickups },
    amberPickups: { ...left.amberPickups, ...right.amberPickups },
    seen: [...left.seen, ...right.seen],
  });
}
export function recordPickup(raw: unknown, id: string, item: ItemId): CompanionState {
  const state = normalizeCompanions(raw);
  if (!validReceipt(id) || !isItem(item) || state.pickups[id]) return state;
  return { ...state, pickups: { ...state.pickups, [id]: item } };
}
export function recordAmber(raw: unknown, id: string): CompanionState {
  const state = normalizeCompanions(raw);
  if (!validReceipt(id) || state.amberPickups[id]) return state;
  return { ...state, amberPickups: { ...state.amberPickups, [id]: true } };
}
export function equipCompanion(
  raw: unknown,
  item: ItemId | null,
  requestedSlot?: ItemSlot,
): CompanionState {
  const state = normalizeCompanions(raw);
  if (item !== null && (!isItem(item) || countItem(state, item) < 50)) return state;
  const slots = item
    ? [itemSlot(item)]
    : requestedSlot
      ? [requestedSlot]
      : (['offense', 'defense'] as const);
  const next = {
    ...state,
    equippedSlots: { ...state.equippedSlots },
    slotUpdatedAt: { ...state.slotUpdatedAt },
  };
  for (const slot of slots) {
    next.equippedSlots[slot] = item;
    next.slotUpdatedAt[slot] = Math.max(Date.now(), state.equippedAt + 1);
  }
  return normalizeCompanions(next);
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
