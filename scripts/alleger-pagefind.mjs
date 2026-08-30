#!/usr/bin/env node
/**
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

import { existsSync, statSync, unlinkSync } from 'node:fs';

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
