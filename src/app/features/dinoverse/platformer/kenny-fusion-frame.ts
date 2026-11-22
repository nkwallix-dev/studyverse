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
const frillSourceCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();

export function loadKennyFusionAtlas(skin: string): Promise<HTMLImageElement> {
  const selected = normalizedKennySkin(skin);
  const cached = atlasCache.get(selected);
  if (cached) return cached;
  const load = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth !== 1536 || image.naturalHeight !== 1536) {
        reject(new Error(`Ungültiger Fusionsatlas: ${selected}`));
        return;
      }
      resolve(image);
    };
    image.onerror = () => reject(new Error(`Fusionsatlas fehlt: ${selected}`));
    image.src = new URL(`kenny/animations/fusions/${selected}-polished.png?v=6`, document.baseURI).href;
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
  if (atlas.naturalWidth === 1536 && atlas.naturalHeight === 1536) {
    // Polished sources have exactly 192 transparent-margined pixels per cell.
    // Draw every pixel: old 8px crop visibly amputated nose and tail.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(atlas, column * 192, row * 192, 192, 192, 0, 0, 192, 192);
    return;
  }
  const cellWidth = atlas.naturalWidth / 8;
  const cellHeight = atlas.naturalHeight / 8;
  // Attack pose 7 extends nearly to the cell edges (head left, spikes right).
  // Other poses get the wider inset to suppress bleed from neighbour cells.
  const padX = column === 7 ? 2 : 8;
  const padY = 3;
  const unitX = resolution / cellWidth;
  const unitY = resolution / cellHeight;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (row === 6 && column === 7 && typeof document !== 'undefined') {
    // The shipped spikes+frill tail-swing frame omits its frill. Draw the
    // intact frill from pose 0 behind the attacking head, then the actual
    // swipe on top. No neighbouring pose is overlaid over the tail.
    let base = frillSourceCache.get(atlas);
    if (!base) {
      base = document.createElement('canvas');
      drawKennyFusionCell(base, atlas, row, 0);
      frillSourceCache.set(atlas, base);
    }
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(28, 61, 42, 57, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(base, -68, 8);
    ctx.restore();
  }
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

/** Build bite poses at runtime from the SAME actual Kenny/fusion atlas.
 * Only the skull/neck moves, with the legs and inventory staying fully visible.
 * The resulting poses are reused for every skin and all eight fusion rows.
 */
export function composeKennyDirectionalBite(
  target: HTMLCanvasElement,
  standing: HTMLCanvasElement,
  openMouth: HTMLCanvasElement,
  aim: number,
  progress: number,
): void {
  if (target.width !== 192 || target.height !== 192) {
    target.width = 192;
    target.height = 192;
  }
  const ctx = target.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, 192, 192);
  ctx.drawImage(standing, 0, 0);
  // Cut the actual head only, not the shoulders, chest or clawed arms.
  // Old 68px ellipse erased most of Kenny's torso in the small sprites.
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.ellipse(140, 67, 43, 49, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const open = progress >= 0.20 && progress <= 0.80;
  const headSource = open ? openMouth : standing;
  const head = document.createElement('canvas');
  head.width = 192;
  head.height = 192;
  const headCtx = head.getContext('2d');
  if (!headCtx) return;
  headCtx.drawImage(headSource, 0, 0);
  headCtx.globalCompositeOperation = 'destination-in';
  headCtx.beginPath();
  headCtx.ellipse(140, 67, 46, 51, 0, 0, Math.PI * 2);
  headCtx.fill();

  const ease = progress < 0.25
    ? progress / 0.25
    : progress < 0.75
      ? 1
      : Math.max(0, (1 - progress) / 0.25);
  // Positive canvas rotation points the nose down; negative looks up.
  const angle = (aim < 0 ? -0.34 : aim > 0 ? 0.36 : 0) * ease;
  ctx.save();
  ctx.translate(111, 108);
  ctx.rotate(angle);
  ctx.translate(-111, -108);
  ctx.drawImage(head, 0, 0);
  ctx.restore();
}
