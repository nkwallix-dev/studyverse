import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const skins = ['blue', 'green', 'red', 'pink', 'white'];
const columns = 9;
const rows = 6;
const cell = 192;
const inset = 4;
const horizontalSourceOffset = 8;

const [inputDirectory, outputDirectory] = process.argv.slice(2);
if (!inputDirectory || !outputDirectory) {
  console.error('Usage: node scripts/normalize-kenny-atlases.mjs <input-dir> <output-dir>');
  process.exit(1);
}

await fs.mkdir(outputDirectory, { recursive: true });

for (const skin of skins) {
  const input = path.join(inputDirectory, `${skin}-atlas-clean.png`);
  const output = path.join(outputDirectory, `kenny-${skin}-30fps.png`);
  const metadata = await sharp(input).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (width !== 1536 || height !== 1024) {
    throw new Error(`${skin}: expected Adobe-cleaned 1536x1024 source, got ${width}x${height}`);
  }

  const sourceColumn = 160;
  const sourceRow = height / rows;
  const composites = [];

  for (let row = 0; row < rows; row += 1) {
    const top = Math.round(row * sourceRow);
    const bottom = Math.round((row + 1) * sourceRow);
    for (let column = 0; column < columns; column += 1) {
      const left = Math.max(0, Math.round(horizontalSourceOffset + column * sourceColumn));
      const right = Math.min(width, Math.round(horizontalSourceOffset + (column + 1) * sourceColumn));
      const frame = await sharp(input)
        .extract({ left, top, width: right - left, height: bottom - top })
        .resize({
          width: cell - inset * 2,
          height: cell - inset * 2,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      composites.push({
        input: frame,
        left: column * cell + inset,
        top: row * cell + inset,
      });
    }
  }

  await sharp({
    create: {
      width: columns * cell,
      height: rows * cell,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png({ compressionLevel: 9, palette: false })
    .toFile(output);
  console.log(`normalized ${skin}: ${output}`);
}
