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
import { PREFIXES } from './lib/collections.mjs';

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
  // Le contenu des <script> est retiré avant l'analyse : un gabarit JavaScript
  // qui construit une adresse — `/${slug}` par exemple — n'est pas un lien de
  // la page, et le signaler comme cassé fait perdre confiance dans l'outil.
  const html = readFileSync(page, 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
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

/**
 * Les articles qui attendent leur date de parution.
 *
 * Ils n'ont pas encore de page, donc leurs liens échappaient à ce contrôle
 * jusqu'au matin de leur publication — c'est-à-dire jusqu'au moment où
 * personne ne les relit plus. Un lien mort y patientait tranquillement.
 *
 * On lit donc leur markdown, et on vérifie leurs liens contre les pages
 * servies. Deux réserves : un lien vers un autre article programmé est
 * légitime, et les ancres pures ne concernent pas ce contrôle.
 */
const prematures = [];
{
  const aParaitre = [];
  const aujourdhui = new Date().toISOString().slice(0, 10);
  for (const [dossier, prefixe] of Object.entries(PREFIXES)) {
    if (!existsSync(dossier)) continue;
    for (const f of readdirSync(dossier).filter((f) => f.endsWith('.md'))) {
      const md = readFileSync(join(dossier, f), 'utf8');
      const date = md.slice(0, 1400).match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
      if (!date || date <= aujourdhui) continue;
      aParaitre.push({ fichier: `${dossier}/${f}`, url: `${prefixe}${f.replace(/\.md$/, '')}`, md, date });
    }
  }
  const urlsAParaitre = new Set(aParaitre.map((a) => a.url));

  /**
   * Deux textes programmés, et l'ordre dans lequel ils paraissent.
   *
   * Un lien d'un texte programmé vers un autre est légitime — tant que la
   * cible paraît en premier. Vingt-neuf textes anglais s'attendent les uns les
   * autres sur onze semaines : il suffit d'avancer une date pour qu'un guide
   * sorte avant l'article qu'il cite, et le lien est mort le matin de sa
   * parution. Personne ne relit ce jour-là, et le contrôle, lui, voyait deux
   * textes programmés et se taisait.
   */
  const dateDe = new Map(aParaitre.map((a) => [a.url, a.date]));

  for (const a of aParaitre) {
    for (const m of a.md.matchAll(/\]\((\/[^)\s#?]*)\)/g)) {
      const href = m[1].replace(/\/$/, '') || '/';
      if (urlsAParaitre.has(href) && dateDe.get(href) > a.date) {
        prematures.push({ source: a.fichier, date: a.date, cible: href, cibleDate: dateDe.get(href) });
      }
      if (servies.has(href) || urlsAParaitre.has(href)) continue;
      if (existsSync(join(DIST, href)) && statSync(join(DIST, href)).isFile()) continue;
      if (!casses.has(href)) casses.set(href, new Set());
      casses.get(href).add(`${a.fichier} (paraît le ${a.md.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)[1]})`);
    }
  }
}

if (prematures.length) {
  console.error(`✗ ${prematures.length} lien(s) vers un texte qui paraît plus tard :\n`);
  for (const p of prematures) {
    console.error(`  ${p.source} (paraît le ${p.date})`);
    console.error(`      pointe vers ${p.cible}, qui ne paraît que le ${p.cibleDate}`);
  }
  console.error('\n   Le lien sera mort le matin de la parution de la source.');
  console.error('   Avancez la cible, ou reculez la source.\n');
}

if (casses.size === 0 && !prematures.length) {
  console.log(`✓ ${pages.length} pages contrôlées, articles programmés compris — aucun lien interne cassé.`);
  process.exit(0);
}

if (casses.size === 0) process.exit(1);

console.error(`✗ ${casses.size} lien(s) interne(s) cassé(s) :\n`);
for (const [href, sources] of casses) {
  console.error(`  ${href}`);
  for (const s of sources) console.error(`      depuis ${s}`);
}
process.exit(1);
