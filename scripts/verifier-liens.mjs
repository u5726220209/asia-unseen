/**
 * Vérifie que tous les liens internes du site compilé pointent vers une page
 * qui existe réellement.
 *
 *   npm run build && node scripts/verifier-liens.mjs
 *
 * Un lien interne cassé ne fait pas échouer la compilation d'Astro : il se
 * découvre en production, quand un lecteur clique. D'où ce contrôle.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';

if (!existsSync(DIST)) {
  console.error("dist/ est absent — lancez d'abord `npm run build`.");
  process.exit(1);
}

const pages = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) pages.push(full);
  }
})(DIST);

// Les URL servies : /a-propos pour dist/a-propos/index.html, etc.
const servies = new Set(
  pages
    .map((f) => '/' + relative(DIST, f).replace(/index\.html$/, '').replace(/\/$/, ''))
    .map((u) => (u === '' ? '/' : u)),
);

const casses = new Map();

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const href = m[1].replace(/\/$/, '') || '/';
    if (href.startsWith('/_astro')) continue;
    if (servies.has(href)) continue;
    if (existsSync(join(DIST, href)) && statSync(join(DIST, href)).isFile()) continue;

    const source = relative(DIST, page);
    if (!casses.has(href)) casses.set(href, new Set());
    casses.get(href).add(source);
  }
}

if (casses.size === 0) {
  console.log(`✓ ${pages.length} pages contrôlées — aucun lien interne cassé.`);
  process.exit(0);
}

console.error(`✗ ${casses.size} lien(s) interne(s) cassé(s) :\n`);
for (const [href, sources] of casses) {
  console.error(`  ${href}`);
  for (const s of sources) console.error(`      depuis ${s}`);
}
process.exit(1);
