/** Display-only mapping from the supplied asset_manifest.json. Stored item IDs never change. */
export const COSMETIC_IMAGES: Readonly<Record<string,string>> = {
  "cosmic": "cosmetics/themes/cosmic_theme.png",
  "arcade": "cosmetics/themes/arcade_theme.png",
  "lava": "cosmetics/themes/lava_theme.png",
  "frost": "cosmetics/themes/frost_theme.png",
  "sakura": "cosmetics/themes/sakura_theme.png",
  "matrix": "cosmetics/themes/matrix_theme.png",
  "sunset": "cosmetics/themes/sunset_theme.png",
  "blueprint": "cosmetics/themes/blueprint_theme.png",
  "neon": "cosmetics/themes/neon_theme.png",
  "pizza": "cosmetics/themes/pizza_theme.png",
  "paper": "cosmetics/themes/paper_theme.png",
  "hologram": "cosmetics/themes/hologram_theme.png",
  "dsai_neural": "cosmetics/themes/dsai_neural_theme.png",
  "dsai_terminal": "cosmetics/themes/dsai_terminal_theme.png",
  "sharp_theme": "cosmetics/themes/sharp_theme_theme.png",
  "sharp_cutline": "cosmetics/themes/sharp_cutline_theme.png",
  "default": "cosmetics/avatars/default_avatar.png",
  "avatar_pizza": "cosmetics/avatars/pizza_avatar.png",
  "avatar_alien": "cosmetics/avatars/alien_avatar.png",
  "avatar_frog": "cosmetics/avatars/laborfish_avatar.png",
  "avatar_brain": "cosmetics/avatars/galaxy_brain_avatar.png",
  "avatar_crown": "cosmetics/avatars/gold_crown_avatar.png",
  "chem_flask": "cosmetics/avatars/chem_flask_avatar.png",
  "dsai_bot": "cosmetics/avatars/dsai_bot_avatar.png",
  "dsai_panda": "cosmetics/avatars/dsai_panda_avatar.png",
  "dsai_spider": "cosmetics/avatars/dsai_spider_avatar.png",
  "dsai_python": "cosmetics/avatars/dsai_python_avatar.png",
  "sharp_sheep": "cosmetics/avatars/sharp_sheep_avatar.png",
  "sharp_scissors": "cosmetics/avatars/sharp_scissors_avatar.png",
  "sharp_ram": "cosmetics/avatars/sharp_ram_avatar.png",
  "kenny_avatar": "cosmetics/avatars/kenny_blue_avatar.png",
  "kenny_avatar_pink": "cosmetics/avatars/kenny_pink_avatar.png",
  "kenny_avatar_green": "cosmetics/avatars/kenny_green_avatar.png",
  "kenny_avatar_red": "cosmetics/avatars/kenny_red_avatar.png",
  "kenny_avatar_zebra": "kenny/skins/kenny-zebra-portrait.png",
  "tasty_token": "cosmetics/currency/tasty_token.png",
  "kenny_feed_button": "cosmetics/ui/feed_exchange.png",
};

const LEGACY_AVATARS: Readonly<Record<string,string>> = {
  '🧪':'default', '🍕':'avatar_pizza', '👽':'avatar_alien', '🐟':'avatar_frog',
  '🧠':'avatar_brain', '👑':'avatar_crown', '⚗️':'chem_flask', '🤖':'dsai_bot',
  '🐼':'dsai_panda', '🕷️':'dsai_spider', '🐍':'dsai_python', '🐑':'sharp_sheep',
  '✂️':'sharp_scissors', '🐏':'sharp_ram', '🦖':'kenny_avatar'
};

/** Paths are document-base-relative so /studyverse/ works on GitHub Pages. */
export function cosmeticImage(id:string|null|undefined):string|null {
  if (!id) return null;
  return COSMETIC_IMAGES[id] ?? null;
}

export function avatarImage(value:string|null|undefined):string|null {
  return cosmeticImage(LEGACY_AVATARS[value||''] || value);
}

