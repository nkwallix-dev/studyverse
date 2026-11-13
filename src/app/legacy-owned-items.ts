import { ShopItem } from './shop-items';

/** Removed from the SHOP, but existing owners must keep their purchased cosmetics.
 * These items never appear as obtainable drops or affect MathsVerse availability. */
export const LEGACY_OWNED_ITEMS: ShopItem[] = [
 {id:'maths_avatar_pi',kind:'avatar',icon:'🦊',name:'Pi-Fuchs',cost:85,desc:'Archiviertes MathsVerse-Cosmetic aus deiner bisherigen Sammlung.',group:'avatar',drop:'maths-hw-02',requirement:{metric:'academy',value:2}},
 {id:'maths_title_integral',kind:'title',icon:'∑',name:'Integral-Genie',cost:160,desc:'Archivierter MathsVerse-Titel aus deiner bisherigen Sammlung.',group:'title',drop:'maths-hw-02',requirement:{metric:'academy',value:4}},
 // Admin-only entitlement: never sold or unlocked through a client-editable save.
 {id:'exclusive_title_cheater',kind:'title',icon:'🃏',name:'Cheater',cost:0,desc:'Ein exklusiver Titel, der nur deinem Account zugeteilt wurde.',group:'title',drop:'exclusive'}
];
