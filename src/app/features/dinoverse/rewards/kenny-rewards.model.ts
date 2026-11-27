import type { DinoTier } from '../../../dino-season';
import type { ShopItem } from '../../../shop-items';

/** Display data only. The season's actual draw pool and ownership rules stay in App. */
export interface KennyPoolTier {
  key: 'event' | 'reindeer' | 'large' | 'medium' | 'small';
  name: string;
  chance: number;
  items: ReadonlyArray<ShopItem>;
}

export type KennyPrizeOdds = Readonly<Record<DinoTier, number>>;
