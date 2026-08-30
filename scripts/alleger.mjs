#!/usr/bin/env node
/**
 * Retirer du site publié ce que personne ne téléchargera jamais.
 *
 * Deux poids morts, tous deux invisibles : les habillages de Pagefind, et les
 * originaux que le générateur recopie à côté des variantes qu'il produit.
 *
 * ── Pagefind ──
 * Pagefind livre plusieurs habillages tout faits pour son champ de recherche.
 * Ce site n'en utilise aucun : il a sa propre interface, et n'appelle que le
 * moteur — `pagefind.js`, chargé à la demande quand on ouvre la recherche.
 *
 * Les habillages inutilisés représentent 408 Ko transférés à chaque mise en
 * ligne, jamais demandés par le moindre visiteur. Ils ne ralentissent personne ;
 * ils allongent le déploiement et encombrent la lecture du dossier.
 *
 * Ce nettoyage refuse de s'exécuter s'il ne retrouve pas le moteur, pour ne
 * jamais casser la recherche au motif de gagner quelques kilo-octets.
 */

import { existsSync, statSync, unlinkSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const MOTEUR = 'dist/pagefind/pagefind.js';

const INUTILISES = [
  'dist/pagefind/pagefind-ui.js',
  'dist/pagefind/pagefind-ui.css',
  'dist/pagefind/pagefind-component-ui.js',
  'dist/pagefind/pagefind-component-ui.css',
  'dist/pagefind/pagefind-modular-ui.js',
  'dist/pagefind/pagefind-modular-ui.css',
  'dist/pagefind/pagefind-highlight.js',
];

if (!existsSync(MOTEUR)) {
  console.error(`${MOTEUR} est introuvable : nettoyage annulé, la recherche passe avant.`);
  process.exit(0);
}

let gagne = 0;
let retires = 0;
for (const f of INUTILISES) {
  if (!existsSync(f)) continue;
  gagne += statSync(f).size;
  unlinkSync(f);
  retires++;
}

if (retires) console.log(`Pagefind allégé : ${retires} habillages inutilisés retirés, ${Math.round(gagne / 1024)} Ko.`);


/* ── Les originaux recopiés par le générateur ────────────────────── */

/**
 * Astro produit les variantes WebP réellement servies, puis recopie l'original
 * dans le site publié. Aucune page ne le référence : c'est du transfert pur.
 * Neuf photographies représentaient ainsi 4,6 Mo expédiés à chaque mise en
 * ligne pour rien.
 *
 * La suppression se fait sur preuve, jamais sur supposition : on ne retire un
 * fichier que si aucune page ne le nomme — ni en src, ni dans un srcset, ni
 * dans une balise de partage social.
 */
const lister = (motif) =>
  execFileSync('bash', ['-c', `find dist ${motif} -type f 2>/dev/null || true`], { encoding: 'utf8' })
    .split('\n').filter(Boolean);

const references = new Set();
for (const f of lister('-name "*.html"')) {
  const c = readFileSync(f, 'utf8');
  for (const m of c.matchAll(/(?:src|href|content)="([^"]+)"/g)) references.add(m[1].replace(/^\//, ''));
  for (const m of c.matchAll(/srcset="([^"]+)"/g)) {
    for (const p of m[1].split(',')) references.add(p.trim().split(/\s+/)[0].replace(/^\//, ''));
  }
}

let gagneImages = 0;
let retireesImages = 0;
for (const f of lister('-path "dist/_astro/*" \\( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" \\)')) {
  if (references.has(f.replace(/^dist\//, ''))) continue;
  gagneImages += statSync(f).size;
  unlinkSync(f);
  retireesImages++;
}

if (retireesImages) {
  console.log(`Originaux non servis retirés : ${retireesImages} fichiers, ${Math.round(gagneImages / 1024)} Ko.`);
}
