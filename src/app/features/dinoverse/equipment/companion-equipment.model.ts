export type DinoSpecies = 'triceratops' | 'stegosaurus';
export type ItemId =
  'triceratops-horns' | 'triceratops-frill' | 'stegosaurus-plates' | 'stegosaurus-spikes';
export type ItemSlot = 'offense' | 'defense';
export type EquipmentSlots = Record<ItemSlot, ItemId | null>;

/** Complete and mixed kit achievements count distinct actual runs, not item pickups. */
export const FUSION_GOALS = {
  'full-stego': { offense: 'stegosaurus-spikes', defense: 'stegosaurus-plates', runs: 25 },
  'full-trike': { offense: 'triceratops-horns', defense: 'triceratops-frill', runs: 25 },
  'horns-plates': { offense: 'triceratops-horns', defense: 'stegosaurus-plates', runs: 10 },
  'spikes-frill': { offense: 'stegosaurus-spikes', defense: 'triceratops-frill', runs: 10 },
} as const satisfies Record<string, { offense: ItemId; defense: ItemId; runs: number }>;
export type FusionId = keyof typeof FUSION_GOALS;
export const FUSION_IDS = Object.keys(FUSION_GOALS) as FusionId[];
export const isFusionId = (id: unknown): id is FusionId =>
  typeof id === 'string' && Object.prototype.hasOwnProperty.call(FUSION_GOALS, id);
export function fusionIdForSlots(slots: Partial<EquipmentSlots>): FusionId | null {
  return (
    FUSION_IDS.find(
      (id) =>
        FUSION_GOALS[id].offense === slots.offense &&
        FUSION_GOALS[id].defense === slots.defense,
    ) ?? null
  );
}
export const countFusionRuns = (state: CompanionState, fusion: FusionId): number =>
  state.fusionRuns?.[fusion]?.length ?? 0;
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
      'L: Schwanzschlag mit Reichweite 3 und 3 Schaden; danach 0,25 Schaden/s für 4 Sekunden.',
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
  /** Unique world-run receipts per two-item combination. Cloud merges by union. */
  fusionRuns: Record<FusionId, string[]>;
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
  const rawRuns = data.fusionRuns && typeof data.fusionRuns === 'object'
    ? data.fusionRuns : {} as Partial<Record<FusionId, unknown>>;
  const fusionRuns = {} as Record<FusionId, string[]>;
  for (const id of FUSION_IDS) {
    const receipts = rawRuns[id];
    fusionRuns[id] = Array.isArray(receipts)
      ? [...new Set(receipts.filter((receipt): receipt is string =>
          typeof receipt === 'string' && validReceipt(receipt)))].sort()
      : [];
  }
  const slots: EquipmentSlots = { offense: null, defense: null };
  const times = { offense: 0, defense: 0 };
  const legacy = isItem(data.equipped) ? data.equipped : null;
  const hasSlots = !!data.equippedSlots && typeof data.equippedSlots === 'object';
  const proposed: Partial<EquipmentSlots> = hasSlots
    ? data.equippedSlots || {}
    : { [legacy && itemSlot(legacy) === 'offense' ? 'offense' : 'defense']: legacy };
  const fusion = fusionIdForSlots(proposed);
  const fusionUnlocked = fusion !== null && fusionRuns[fusion].length >= FUSION_GOALS[fusion].runs;
  for (const slot of ['offense', 'defense'] as const) {
    const value = hasSlots
      ? data.equippedSlots?.[slot]
      : legacy && itemSlot(legacy) === slot
        ? legacy
        : null;
    if (
      isItem(value) &&
      itemSlot(value) === slot &&
      (Object.values(pickups).filter((id) => id === value).length >= 50 || fusionUnlocked)
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
    fusionRuns,
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
    fusionRuns: Object.fromEntries(
      FUSION_IDS.map((id) => [id, [...new Set([...left.fusionRuns[id], ...right.fusionRuns[id]])].sort()]),
    ),
    seen: [...left.seen, ...right.seen],
  });
}
export function recordPickup(raw: unknown, id: string, item: ItemId): CompanionState {
  const state = normalizeCompanions(raw);
  if (!validReceipt(id) || !isItem(item) || state.pickups[id]) return state;
  return { ...state, pickups: { ...state.pickups, [id]: item } };
}
/** One credit per fusion per real world.runId, even if Q/E swaps gear repeatedly. */
export function recordFusionRun(raw: unknown, receipt: string, fusion: FusionId): CompanionState {
  const state = normalizeCompanions(raw);
  if (!validReceipt(receipt) || !isFusionId(fusion) || state.fusionRuns[fusion].includes(receipt))
    return state;
  return normalizeCompanions({
    ...state,
    fusionRuns: { ...state.fusionRuns, [fusion]: [...state.fusionRuns[fusion], receipt] },
  });
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
/** Choose a kit atomically: a run achievement may unlock the pair before 50 solo pickups. */
export function equipCompanionKit(raw: unknown, requested: EquipmentSlots): CompanionState {
  const state = normalizeCompanions(raw);
  const fusion = fusionIdForSlots(requested);
  if (fusion) {
    if (countFusionRuns(state, fusion) < FUSION_GOALS[fusion].runs) return state;
  } else if (
    (requested.offense && (!isItem(requested.offense) || itemSlot(requested.offense) !== 'offense' ||
      countItem(state, requested.offense) < 50)) ||
    (requested.defense && (!isItem(requested.defense) || itemSlot(requested.defense) !== 'defense' ||
      countItem(state, requested.defense) < 50))
  ) {
    return state;
  }
  const updatedAt = Math.max(Date.now(), state.equippedAt + 1);
  return normalizeCompanions({
    ...state,
    equippedSlots: { ...requested },
    slotUpdatedAt: { offense: updatedAt, defense: updatedAt },
  });
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
