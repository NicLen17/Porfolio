/**
 * Builds the hero mosaic atlases: every tile picture in `heroShots`
 * (src/data/media.ts) packed into one image per screen size, in list order.
 *
 * One request instead of fifty: on a slow connection the whole board lights up
 * at once instead of tile by tile. Run `npm run atlas` after changing the list
 * or any of its pictures, and commit the two files it writes.
 */
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mediaDir = path.join(root, 'src/assets/media');
const outDir = path.join(root, 'src/assets/hero');

/** Must match the layout Hero.astro reads from `atlas.json`. */
const COLS = 8;
const SIZES = { sm: 176, lg: 320 };
const QUALITY = { sm: 42, lg: 44 };

const source = await readFile(path.join(root, 'src/data/media.ts'), 'utf8');
const list = source.slice(source.indexOf('export const heroShots'));
const files = [...list.matchAll(/file: '([^']+)'/g)].map((match) => match[1]);
if (!files.length) throw new Error('No hero shots found in src/data/media.ts');
const rows = Math.ceil(files.length / COLS);

await mkdir(outDir, { recursive: true });
for (const [name, size] of Object.entries(SIZES)) {
  // Same crop the tiles always had: a square taken from the top of the picture.
  const tiles = await Promise.all(
    files.map(async (file, i) => ({
      input: await sharp(path.join(mediaDir, file)).resize(size, size, { fit: 'cover', position: 'top' }).png().toBuffer(),
      left: (i % COLS) * size,
      top: Math.floor(i / COLS) * size,
    })),
  );
  const out = path.join(outDir, `atlas-${name}.avif`);
  const info = await sharp({ create: { width: COLS * size, height: rows * size, channels: 3, background: '#0b100e' } })
    .composite(tiles)
    .avif({ quality: QUALITY[name], effort: 6 })
    .toFile(out);
  console.log(`${path.relative(root, out)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
}

const { writeFile } = await import('node:fs/promises');
await writeFile(path.join(outDir, 'atlas.json'), JSON.stringify({ cols: COLS, rows, count: files.length, files }, null, 2) + '\n');
console.log(`${files.length} tiles, ${COLS} x ${rows}`);
