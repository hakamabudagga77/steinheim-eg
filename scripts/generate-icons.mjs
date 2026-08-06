import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Brand monogram for the PWA: charcoal tile with a cream serif-italic "S".
// Same identity language as the site (cream #ece9e2, charcoal #0a0a0a).
function monogramSvg(size, maskable = false) {
  const safeZone = maskable ? size * 0.24 : size * 0.1;
  const fontSize = size * 0.62;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0a0a0a"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif" font-style="italic"
    font-size="${fontSize}" fill="#ece9e2" transform="translate(0, ${size * 0.02})">S</text>
</svg>`;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-touch-icon.png", size: 180, maskable: false },
];

for (const { file, size, maskable } of targets) {
  const png = await sharp(Buffer.from(monogramSvg(size, maskable)))
    .png({ compressionLevel: 9 })
    .toBuffer();
  writeFileSync(join(outDir, file), png);
  console.log(`generated public/icons/${file} (${size}x${size}${maskable ? ", maskable" : ""})`);
}
