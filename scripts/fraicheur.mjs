#!/usr/bin/env node
/**
 * Le calendrier de fraîcheur.
 *
 * Il ne vérifie rien : il dit ce qui est dû. Chaque fiche pays porte une date
 * de vérification, et le site promet au lecteur que cette date veut dire
 * quelque chose. Ce script transforme cette promesse en échéancier.
 *
 * Trois horizons, parce que tout ne vieillit pas au même rythme :
 *   · les formalités d'entrée changent plusieurs fois par an → 4 mois
 *   · les grilles tarifaires d'assurance suivent l'année commerciale → 6 mois
 *   · les budgets et les saisons bougent lentement → 12 mois
 */

import { readFileSync } from 'node:fs';

const AUJOURD_HUI = new Date();
const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

const ECHEANCES = { visa: 4, tarifs: 6, fond: 12 };

const moisEcoules = (yyyyMM) => {
  const [a, m] = yyyyMM.split('-').map(Number);
  return (AUJOURD_HUI.getFullYear() - a) * 12 + (AUJOURD_HUI.getMonth() + 1 - m);
};
const enClair = (yyyyMM) => {
  const [a, m] = yyyyMM.split('-');
  return `${MOIS_FR[+m - 1]} ${a}`;
};

const ts = readFileSync('src/data/countries.ts', 'utf8');
const pays = [];
for (const m of ts.matchAll(/slug: '([a-z-]+)',\s*\n\s*nom: '([^']+)'/g)) {
  const suite = ts.slice(m.index);
  const v = suite.match(/verifieLe: '([\d-]+)'/);
  if (v) pays.push({ slug: m[1], nom: m[2], verifieLe: v[1], age: moisEcoules(v[1]) });
}

let tarifs = null;
try {
  const as = readFileSync('src/data/assurances.ts', 'utf8');
  const d = as.match(/releveLe = '([\d-]+)'/);
  if (d) tarifs = { date: d[1], age: moisEcoules(d[1].slice(0, 7)) };
} catch {}

const dus = pays.filter((p) => p.age >= ECHEANCES.visa).sort((a, b) => b.age - a.age);
const bientot = pays.filter((p) => p.age === ECHEANCES.visa - 1);

const json = process.argv.includes('--json');

if (json) {
  console.log(JSON.stringify({
    date: AUJOURD_HUI.toISOString().slice(0, 10),
    echeances: ECHEANCES,
    dus: dus.map((p) => ({ slug: p.slug, nom: p.nom, verifieLe: p.verifieLe, moisEcoules: p.age })),
    bientot: bientot.map((p) => p.nom),
    tarifs,
  }, null, 2));
} else {
  console.log(`Calendrier de fraîcheur — ${AUJOURD_HUI.toLocaleDateString('fr-FR')}\n`);
  console.log(`  Formalités : à revérifier tous les ${ECHEANCES.visa} mois`);
  console.log(`  Tarifs     : tous les ${ECHEANCES.tarifs} mois\n`);

  if (dus.length) {
    console.log(`⚠  ${dus.length} fiche(s) à revérifier :\n`);
    for (const p of dus) {
      console.log(`   ${p.nom.padEnd(16)} vérifiée en ${enClair(p.verifieLe).padEnd(16)} il y a ${p.age} mois`);
    }
    console.log();
  } else {
    console.log('✓ Aucune fiche pays n\'a dépassé son échéance.\n');
  }

  if (bientot.length) console.log(`   Échéance le mois prochain : ${bientot.map((p) => p.nom).join(', ')}\n`);

  if (tarifs) {
    const etat = tarifs.age >= ECHEANCES.tarifs ? '⚠  à revérifier' : '✓ à jour';
    console.log(`   Grilles d'assurance : relevées le ${tarifs.date}, il y a ${tarifs.age} mois — ${etat}\n`);
  }

  console.log('   Revérifier une fiche, c\'est : lire la source officielle, corriger si besoin,');
  console.log('   ajouter l\'entrée au journal des corrections, remonter verifieLe.\n');
}

process.exit(dus.length || (tarifs && tarifs.age >= ECHEANCES.tarifs) ? 1 : 0);
