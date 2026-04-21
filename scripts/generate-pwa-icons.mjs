import sharp from 'sharp';
import { promises as fs } from 'node:fs';

const src = 'src/assets/KAHEAA.svg';
const outDir = 'public';

async function writeContainPng(fileName, size, background) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background })
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/${fileName}`);
}

async function run() {
  await fs.access(src);

  // Standard PWA icons
  await writeContainPng('pwa-192x192-v2.png', 192, { r: 255, g: 255, b: 255, alpha: 0 });
  await writeContainPng('pwa-512x512-v2.png', 512, { r: 255, g: 255, b: 255, alpha: 0 });

  // Maskable icon gets a solid background for safe cropping.
  await writeContainPng('pwa-maskable-512x512-v2.png', 512, { r: 15, g: 23, b: 42, alpha: 1 });

  // Favicon / app icon aliases
  await writeContainPng('pwa-icon-v2.png', 192, { r: 255, g: 255, b: 255, alpha: 0 });
  await writeContainPng('apple-touch-icon-v2.png', 180, { r: 255, g: 255, b: 255, alpha: 1 });

  // Keep an SVG copy in public for future reuse.
  await fs.copyFile(src, `${outDir}/kaheaa-logo-v2.svg`);

  console.log('Generated updated PWA icons in public/.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
