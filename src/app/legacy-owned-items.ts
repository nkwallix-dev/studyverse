import { ShopItem } from './shop-items';

/** Removed from the SHOP, but existing owners must keep their purchased cosmetics.
 * These items never appear as obtainable drops or affect MathsVerse availability. */
export const LEGACY_OWNED_ITEMS: ShopItem[] = [
 // Admin-only entitlement: never sold or unlocked through a client-editable save.
 {id:'exclusive_title_cheater',kind:'title',icon:'🃏',name:'Cheater',cost:0,desc:'Ein exklusiver Titel, der nur deinem Account zugeteilt wurde.',group:'title',drop:'exclusive'}
];
