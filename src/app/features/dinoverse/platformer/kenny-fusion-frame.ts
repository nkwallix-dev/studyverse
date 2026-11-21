/** Shared, grid-exact atlas cropping for previews and the playable character.
 * The original 1254px atlases have fractional (156.75px) cells and a few
 * neighbouring pixels at the edges. Draw only the interior of each cell.
 */
export const KENNY_FUSION_SKINS = ['blue', 'pink', 'green', 'red', 'zebra'] as const;

export function normalizedKennySkin(skin: string): string {
  return KENNY_FUSION_SKINS.includes(skin as (typeof KENNY_FUSION_SKINS)[number])
    ? skin
    : 'blue';
}

const atlasCache = new Map<string, Promise<HTMLImageElement>>();

export function loadKennyFusionAtlas(skin: string): Promise<HTMLImageElement> {
  const selected = normalizedKennySkin(skin);
  const cached = atlasCache.get(selected);
  if (cached) return cached;
  const load = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth !== 1254 || image.naturalHeight !== 1254) {
        reject(new Error(`Ungültiger Fusionsatlas: ${selected}`));
        return;
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Fusionsatlas fehlt: ${selected}`));
    image.src = new URL(`kenny/animations/fusions/${selected}.png?v=4`, document.baseURI).href;
  });
  atlasCache.set(selected, load);
  // A transient network error must not poison the preview forever.
  void load.catch(() => atlasCache.delete(selected));
  return load;
}

/** Draws one 8×8 cell, keeping the original scale and removing lateral atlas bleed. */
export function drawKennyFusionCell(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  row: number,
  column: number,
): void {
  const resolution = 192;
  if (canvas.width !== resolution || canvas.height !== resolution) {
    canvas.width = resolution;
    canvas.height = resolution;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, resolution, resolution);
  const cellWidth = atlas.naturalWidth / 8;
  const cellHeight = atlas.naturalHeight / 8;
  // 8 source px on each side removes stray pixels from the adjacent frames.
  const padX = 8;
  const padY = 3;
  const unitX = resolution / cellWidth;
  const unitY = resolution / cellHeight;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(
    atlas,
    column * cellWidth + padX,
    row * cellHeight + padY,
    cellWidth - 2 * padX,
    cellHeight - 2 * padY,
    padX * unitX,
    padY * unitY,
    resolution - 2 * padX * unitX,
    resolution - 2 * padY * unitY,
  );
}
