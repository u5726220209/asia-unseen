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

import { readFileSync, existsSync } from 'node:fs';

const AUJOURD_HUI = new Date();
const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

const ECHEANCES = { visa: 4, tarifs: 6, fond: 12 };

/**
 * Mois écoulés depuis une date.
 *
 * Les fiches pays ne portent qu'un mois (« 2026-08 ») : la précision au jour
 * n'a pas de sens pour une règle de visa, et le mois suffit. Les relevés
 * tarifaires portent une date complète, et là le jour compte — la version
 * précédente annonçait « il y a 1 mois » pour un relevé de l'avant-veille,
 * simplement parce que le numéro du mois avait changé entre-temps.
 */
const moisEcoules = (date) => {
  const [a, m, j] = date.split('-').map(Number);
  const brut = (AUJOURD_HUI.getFullYear() - a) * 12 + (AUJOURD_HUI.getMonth() + 1 - m);
  // Si le jour du mois n'est pas encore atteint, le mois n'est pas révolu.
  return j && AUJOURD_HUI.getDate() < j ? Math.max(0, brut - 1) : brut;
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
  if (d) tarifs = { date: d[1], age: moisEcoules(d[1]) };
} catch {}

/**
 * Les montants qu'aucun robot ne peut relire.
 *
 * Certaines sources calculent leurs prix dans le navigateur : la sentinelle
 * des chiffres les écarte de ses alertes pour ne pas crier chaque matin, et
 * renvoie explicitement à ce calendrier. C'est donc ici qu'ils doivent
 * réapparaître — sinon ils sortent du champ de vision pour de bon, ce qui est
 * exactement le contraire du but.
 */
const nonRelisables = (() => {
  const f = 'src/data/chiffres-cites.ts';
  if (!existsSync(f)) return [];
  const src = readFileSync(f, 'utf8');
  const constantes = Object.fromEntries(
    [...src.matchAll(/^const ([A-Z_0-9]+) = '([^']+)';$/gm)].map((m) => [m[1], m[2]]),
  );
  const parSource = new Map();
  for (const m of src.matchAll(/\{ affiche: '([^']+)'[^}]*source: ([A-Z_0-9]+), releveLe: '([^']+)'[^}]*sourceIntrouvableAttendue:\s*true[^}]*\}/g)) {
    const url = constantes[m[2]] ?? m[2];
    const age = moisEcoules(m[3]);
    const e = parSource.get(url) ?? { url, n: 0, age: 0, date: m[3] };
    parSource.set(url, { ...e, n: e.n + 1, age: Math.max(e.age, age), date: e.date < m[3] ? e.date : m[3] });
  }
  return [...parSource.values()].sort((a, b) => b.age - a.age);
})();

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

  if (nonRelisables.length) {
    const total = nonRelisables.reduce((a, s) => a + s.n, 0);
    console.log(`   ${total} montant(s) sur ${nonRelisables.length} source(s) qu'aucun robot ne peut relire :`);
    for (const s of nonRelisables) {
      const etat = s.age >= ECHEANCES.tarifs ? '⚠ à rouvrir' : '✓ récent';
      console.log(`     ${String(s.n).padStart(3)} montants · relevés il y a ${s.age} mois — ${etat}`);
      console.log(`         ${s.url}`);
    }
    console.log('     Ces pages calculent leurs prix dans le navigateur. La sentinelle des');
    console.log('     chiffres ne peut donc pas les vérifier : c\'est ici, et seulement ici,');
    console.log('     qu\'on se souvient qu\'elles existent.\n');
  }

  console.log('   Revérifier une fiche, c\'est : lire la source officielle, corriger si besoin,');
  console.log('   ajouter l\'entrée au journal des corrections, remonter verifieLe.\n');
}

process.exit(dus.length || (tarifs && tarifs.age >= ECHEANCES.tarifs) ? 1 : 0);
