/**
 * Génère les dérivés bitmap du logo (favicons, app icons, image OG par défaut)
 * à partir des sources vectorielles de public/brand/.
 *
 *   node scripts/build-brand-assets.mjs
 *
 * Les polices de marque (Space Grotesk) ne sont pas installées au niveau système :
 * le rendu texte de l'image OG utilise donc une fallback grotesque. Si vous voulez
 * le rendu exact, installez Space Grotesk sur la machine de build, ou exportez
 * l'image OG depuis un outil de design.
 */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const badge = await readFile('public/brand/icon-badge.svg');
await mkdir('public/brand/png', { recursive: true });

const sizes = [16, 32, 48, 180, 192, 512];
for (const size of sizes) {
  await sharp(badge, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(`public/brand/png/icon-${size}.png`);
}
// Raccourcis attendus par les navigateurs / OS
await sharp(badge, { density: 384 }).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(badge, { density: 384 }).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(badge, { density: 384 }).resize(192, 192).png().toFile('public/icon-192.png');

// favicon.ico multi-résolutions (32px : suffisant et léger)
await sharp(badge, { density: 384 }).resize(32, 32).png().toFile('public/favicon-32.png');

// --- Image Open Graph par défaut (1200x630) ---
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0A0A0A"/>
  <g fill="none" stroke-linecap="round" stroke-width="13" transform="translate(88 96) scale(1.55)">
    <path d="M9 55 28.5 18" stroke="#F9FAFB"/>
    <path d="M35.5 18 55 55" stroke="#F9FAFB"/>
    <path d="M17 41H47" stroke="#F59E0B"/>
  </g>
  <text x="88" y="352" font-family="Helvetica,Arial,sans-serif" font-size="74" font-weight="700" letter-spacing="-1" fill="#F9FAFB">L'Asie comme vous ne</text>
  <text x="88" y="438" font-family="Helvetica,Arial,sans-serif" font-size="74" font-weight="700" letter-spacing="-1" fill="#F9FAFB">l'avez jamais vue.</text>
  <rect x="88" y="486" width="64" height="5" fill="#F59E0B"/>
  <text x="88" y="546" font-family="Helvetica,Arial,sans-serif" font-size="27" font-weight="500" letter-spacing="5" fill="#9CA3AF">ASIA UNSEEN — GUIDES DE TERRAIN</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile('public/og-default.png');

console.log('✓ Assets de marque générés dans public/');
