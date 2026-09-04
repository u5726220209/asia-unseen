#!/usr/bin/env node
/**
 * La date de vérification, tenue par la machine.
 *
 * Chaque fiche pays porte un mois : « Vérifié en août 2026 ». Ce mois était
 * saisi à la main, et il ne bougeait donc que lorsqu'un humain y pensait.
 * Résultat : sept fiches sur neuf affichaient août au 4 septembre, alors que
 * la sentinelle relisait leurs sources officielles toutes les nuits. La
 * machine vérifiait, et la page disait le contraire.
 *
 * Ce script remonte la date — mais seulement quand elle est méritée.
 *
 * LA CONDITION, ET ELLE EST STRICTE
 * Une fiche n'est remontée que si TOUTES ses sources surveillées ont été
 * relues cette nuit ET qu'aucune n'a bougé. Une seule source injoignable
 * suffit à ne rien toucher : nous ne l'avons pas lue, donc nous n'avons pas
 * vérifié, donc la date ne doit pas prétendre le contraire.
 *
 * C'est la règle entière. Elle rend la date plus solide qu'une relecture
 * humaine — celle-ci arrive toutes les nuits, et elle ne se fatigue pas.
 *
 * CE QUE CE SCRIPT NE FAIT PAS
 * Il ne réécrit aucune règle. Quand une source a bougé, il laisse la fiche
 * exactement où elle est, avec sa vieille date, et la sentinelle ouvre une
 * tâche. Lire un texte administratif et décider de la nouvelle règle reste un
 * travail humain : une date qui recule est un désagrément, une règle inventée
 * est une faute.
 *
 *   node scripts/rafraichir.mjs              relit les sources et applique
 *   node scripts/rafraichir.mjs --essai      dit ce qu'il ferait, sans écrire
 *   node scripts/rafraichir.mjs --veille f   part d'un rapport JSON déjà pris
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const ESSAI = args.includes('--essai');
const FICHIER = args[args.indexOf('--veille') + 1];

const PAYS = 'src/data/countries.ts';
const MOIS = new Date().toISOString().slice(0, 7);

/* ── L'état des sources, cette nuit ──────────────────────────────── */

let rapport;
if (FICHIER && args.includes('--veille') && existsSync(FICHIER)) {
  rapport = JSON.parse(readFileSync(FICHIER, 'utf8'));
} else {
  // La sentinelle sort 1 quand une source a bougé : ce n'est pas une erreur
  // d'exécution, c'est son verdict. On lit sa sortie dans les deux cas.
  try {
    rapport = JSON.parse(execFileSync('node', ['scripts/veille.mjs', '--json'], {
      encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
    }));
  } catch (e) {
    if (!e.stdout) { console.error('La sentinelle n\'a pas pu être lue.'); process.exit(2); }
    rapport = JSON.parse(e.stdout);
  }
}

const inchangees = new Set(rapport.inchangees ?? []);
const injoignables = new Set((rapport.inaccessibles ?? []).map((m) => m.url));
const modifiees = new Set((rapport.modifiees ?? []).map((m) => m.url));

/* ── Les sources de chaque fiche pays ────────────────────────────── */

const ts = readFileSync(PAYS, 'utf8');

/**
 * Le même motif que la sentinelle, et c'est volontaire : deux lectures
 * différentes des mêmes données finiraient par diverger, et la fiche serait
 * remontée sur la foi de sources que personne n'a relues.
 */
const BLOC = /\{\s*label:\s*(?:"([^"]*)"|'([^']*)'),\s*url:\s*'([^']+)'\s*(,\s*surveillee:\s*(true|false)\s*)?\}/g;

const fiches = [];
for (const m of ts.matchAll(/slug: '([a-z-]+)'/g)) {
  const bloc = ts.slice(m.index, m.index + 9000);
  const i = bloc.indexOf('sourcesVisa: [');
  if (i < 0) continue;
  const seg = bloc.slice(i, bloc.indexOf('],', i));

  const urls = [];
  for (const s of seg.matchAll(BLOC)) {
    if (s[5] === 'false') continue;
    urls.push(s[3]);
  }

  const dateAbs = ts.slice(m.index).search(/verifieLe: '/);
  const date = ts.slice(m.index + dateAbs).match(/verifieLe: '([0-9-]+)'/)?.[1] ?? null;
  fiches.push({ slug: m[1], urls, date, position: m.index + dateAbs });
}

/* ── Le verdict, fiche par fiche ─────────────────────────────────── */

const aRemonter = [];
const retenues = [];

for (const f of fiches) {
  if (!f.date) continue;

  if (!f.urls.length) { retenues.push({ ...f, motif: 'aucune source surveillée' }); continue; }

  const bloquantes = f.urls.filter((u) => !inchangees.has(u));
  if (bloquantes.length) {
    const quoi = bloquantes.map((u) =>
      modifiees.has(u) ? 'a bougé' : injoignables.has(u) ? 'injoignable' : 'non relue').join(', ');
    retenues.push({ ...f, motif: quoi, urls: bloquantes });
    continue;
  }

  if (f.date >= MOIS) { retenues.push({ ...f, motif: 'déjà à jour' }); continue; }
  aRemonter.push(f);
}

/* ── L'écriture ──────────────────────────────────────────────────── */

if (aRemonter.length && !ESSAI) {
  // On écrit de la fin vers le début : chaque remplacement décale les
  // positions suivantes, et remonter le fichier à l'envers les préserve.
  let sortie = ts;
  for (const f of [...aRemonter].sort((a, b) => b.position - a.position)) {
    const avant = sortie.slice(0, f.position);
    const apres = sortie.slice(f.position);
    sortie = avant + apres.replace(/verifieLe: '[0-9-]+'/, `verifieLe: '${MOIS}'`);
  }
  writeFileSync(PAYS, sortie);
}

/* ── Le compte rendu ─────────────────────────────────────────────── */

console.log(`Fraîcheur des fiches — relevé du ${new Date().toISOString().slice(0, 10)}\n`);

if (aRemonter.length) {
  console.log(`${ESSAI ? '→' : '✓'} ${aRemonter.length} fiche(s) ${ESSAI ? 'seraient remontées' : 'remontées'} à ${MOIS} :\n`);
  for (const f of aRemonter) {
    console.log(`   ${f.slug.padEnd(14)} ${f.date} → ${MOIS}   (${f.urls.length} source${f.urls.length > 1 ? 's' : ''} relue${f.urls.length > 1 ? 's' : ''}, aucune n'a bougé)`);
  }
  console.log();
} else {
  console.log('   Aucune fiche à remonter ce jour.\n');
}

const bloquees = retenues.filter((r) => r.motif !== 'déjà à jour');
if (bloquees.length) {
  console.log(`   ${bloquees.length} fiche(s) laissées en l'état :\n`);
  for (const r of bloquees) {
    console.log(`   ${r.slug.padEnd(14)} reste à ${r.date}   — ${r.motif}`);
    for (const u of (r.urls ?? []).slice(0, 3)) console.log(`      ${u}`);
  }
  console.log('\n   Une source non relue n\'est pas une source vérifiée. La date');
  console.log('   ne remonte pas tant qu\'elle prétendrait le contraire.\n');
}

const ajour = retenues.filter((r) => r.motif === 'déjà à jour').length;
if (ajour) console.log(`   ${ajour} fiche(s) déjà au mois courant.\n`);

// 0 quoi qu'il arrive : ne rien avoir à remonter n'est pas un échec, et une
// source qui a bougé est déjà signalée par la sentinelle elle-même.
process.exit(0);
