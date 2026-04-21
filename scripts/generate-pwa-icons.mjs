import sharp from 'sharp';
import { promises as fs } from 'node:fs';

const src = 'src/assets/kahelogo.png';
const outDir = 'public';

async function writeContainPng(fileName, size, background, iconScale = 0.78) {
  const iconSize = Math.max(1, Math.round(size * iconScale));
  const logoBuffer = await sharp(src)
    .resize(iconSize, iconSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(`${outDir}/${fileName}`);
}

async function run() {
  await fs.access(src);

  // Standard PWA icons
  await writeContainPng('pwa-192x192-v2.png', 192, { r: 255, g: 255, b: 255, alpha: 1 });
  await writeContainPng('pwa-512x512-v2.png', 512, { r: 255, g: 255, b: 255, alpha: 1 });

  // Maskable icon gets extra-safe padding and solid background.
  await writeContainPng('pwa-maskable-512x512-v2.png', 512, { r: 255, g: 255, b: 255, alpha: 1 }, 0.62);

  // Favicon / app icon aliases
  await writeContainPng('pwa-icon-v2.png', 192, { r: 255, g: 255, b: 255, alpha: 1 });
  await writeContainPng('apple-touch-icon-v2.png', 180, { r: 255, g: 255, b: 255, alpha: 1 });

  // Keep an SVG copy in public for future reuse.
  await fs.copyFile(src, `${outDir}/kaheaa-logo-v2.svg`);

  console.log('Generated updated PWA icons in public/.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
