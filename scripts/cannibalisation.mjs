#!/usr/bin/env node
/**
 * Deux pages du site qui se disputent la même recherche.
 *
 * Google choisit une page par site et par requête. Quand deux des nôtres visent
 * le même terme, il hésite, alterne, et n'en classe bien aucune : le signal se
 * partage au lieu de s'additionner. Le symptôme est reconnaissable — deux pages
 * proches, un bon volume d'impressions, et des positions qui stagnent en page
 * trois alors que le sujet est bien traité.
 *
 * C'est le seul problème de référencement qu'on ne répare pas en écrivant :
 * publier un troisième article sur le même sujet l'aggrave. Il se répare en
 * décidant laquelle des deux pages répond à la requête, et en faisant pointer
 * l'autre vers elle.
 *
 * POURQUOI IL FALLAIT MESURER
 * Deux titres qui se ressemblent ne prouvent rien : deux pages peuvent traiter
 * le même mot en répondant à des intentions différentes, et se classer très
 * bien toutes les deux. Seules les données de Search Console disent si les deux
 * apparaissent réellement sur les mêmes recherches. Ce script le demande plutôt
 * que de le déduire.
 *
 * Il constate, il ne bloque pas : un chevauchement peut être délibéré.
 *
 *   node scripts/cannibalisation.mjs
 *   node scripts/cannibalisation.mjs --jours 90
 */

import { jeton, proprieteDe, interroger, jour } from './lib/search-console.mjs';

const args = process.argv.slice(2);
const JOURS = Number(args[args.indexOf('--jours') + 1]) || 28;

const DOMAINE = (process.env.SITE_URL || 'https://asiaunseen.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');

const cle = process.env.GSC_CLE_JSON;
if (!cle) {
  console.log("Cannibalisation — en attente d'autorisation\n");
  console.log('   Search Console n\'est pas connectée : le secret GSC_CLE_JSON est absent.');
  console.log('   Ce contrôle a besoin des données de Google, il ne se déduit pas du code.\n');
  process.exit(0);
}

const acces = await jeton(JSON.parse(cle));
const propriete = await proprieteDe(acces, DOMAINE);

// Search Console publie avec deux à trois jours de retard.
const lignes = await interroger(acces, propriete, {
  debut: jour(JOURS + 3),
  fin: jour(3),
  dimensions: ['query', 'page'],
  lignes: 2000,
});

/* ── Regroupement ───────────────────────────────────────────────── */

const parRequete = new Map();
for (const l of lignes) {
  const [requete, url] = l.keys;
  const page = url.replace(/^https?:\/\/[^/]+/, '') || '/';
  if (!parRequete.has(requete)) parRequete.set(requete, []);
  parRequete.get(requete).push({ page, impressions: l.impressions, clics: l.clicks, position: l.position });
}

const disputees = [...parRequete.entries()]
  .filter(([, pages]) => pages.length > 1)
  .map(([requete, pages]) => ({
    requete,
    pages: pages.sort((a, b) => b.impressions - a.impressions),
    impressions: pages.reduce((t, p) => t + p.impressions, 0),
    meilleure: Math.min(...pages.map((p) => p.position)),
  }))
  .sort((a, b) => b.impressions - a.impressions);

/**
 * Les couples de pages qui se retrouvent, requête après requête.
 *
 * Un chevauchement sur une seule recherche est un hasard. Le même couple sur
 * plusieurs est une structure : ce sont deux pages qui visent le même sujet,
 * et c'est là qu'il faut trancher.
 */
const couples = new Map();
for (const d of disputees) {
  const noms = [...new Set(d.pages.map((p) => p.page))].sort();
  for (let i = 0; i < noms.length; i++) {
    for (let j = i + 1; j < noms.length; j++) {
      const cle = `${noms[i]}  ⟷  ${noms[j]}`;
      if (!couples.has(cle)) couples.set(cle, { requetes: [], impressions: 0 });
      couples.get(cle).requetes.push(d.requete);
      couples.get(cle).impressions += d.impressions;
    }
  }
}

const recurrents = [...couples.entries()]
  .filter(([, c]) => c.requetes.length >= 2)
  .sort((a, b) => b[1].impressions - a[1].impressions);

/* ── Rapport ────────────────────────────────────────────────────── */

console.log(`Cannibalisation — ${JOURS} derniers jours\n`);
console.log(`   ${lignes.length} couple(s) requête/page relevés`);
console.log(`   ${disputees.length} recherche(s) où plusieurs de nos pages apparaissent\n`);

if (!disputees.length) {
  console.log('✓ Aucune de nos pages ne se dispute une recherche avec une autre.\n');
  process.exit(0);
}

if (recurrents.length) {
  console.log(`⚠  ${recurrents.length} couple(s) de pages se disputent plusieurs recherches :\n`);
  for (const [cle, c] of recurrents.slice(0, 8)) {
    console.log(`   ${cle}`);
    console.log(`      ${c.requetes.length} recherches en commun · ${c.impressions} impressions cumulées`);
    console.log(`      dont : ${c.requetes.slice(0, 4).join(', ')}\n`);
  }
  console.log('   Décidez laquelle répond à la recherche, et faites pointer l\'autre vers');
  console.log('   elle. Publier un troisième article sur le même sujet aggraverait le');
  console.log('   partage du signal au lieu de le résoudre.\n');
}

console.log('   Les recherches les plus disputées, page par page :\n');
for (const d of disputees.slice(0, 10)) {
  console.log(`   « ${d.requete} »  —  ${d.impressions} impressions, meilleure position ${d.meilleure.toFixed(1)}`);
  for (const p of d.pages) {
    console.log(
      `      ${String(p.impressions).padStart(4)} impr.  ${String(p.clics).padStart(2)} clic(s)  ` +
      `pos. ${p.position.toFixed(1).padStart(5)}   ${p.page}`,
    );
  }
  console.log();
}

// Toujours 0 : un chevauchement peut être délibéré, et une page qui se
// classe bien sur deux intentions différentes n'est pas un défaut.
process.exit(0);
