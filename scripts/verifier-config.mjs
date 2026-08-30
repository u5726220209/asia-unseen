#!/usr/bin/env node
/**
 * Les noms des réglages doivent concorder.
 *
 * Le code lit des variables d'environnement ; les workflows les écrivent
 * depuis les secrets du dépôt. Rien ne garantit que les deux listes se
 * correspondent, et c'est exactement le genre d'écart qui ne fait aucun bruit :
 * si un workflow écrit PUBLIC_ADSENSE_SLOT_ARTICLE alors que le code lit
 * PUBLIC_ADSENSE_SLOT_IN_ARTICLE, le site se construit sans erreur et l'encart
 * publicitaire disparaît. On ne le découvre qu'à la facture, des semaines plus
 * tard, sans savoir depuis quand.
 *
 * Ce contrôle compare les deux listes et refuse l'écart dans les deux sens :
 * un réglage lu mais jamais écrit est une fonctionnalité morte en production ;
 * un réglage écrit mais jamais lu est un secret que quelqu'un croit utile.
 */

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const lire = (motif) =>
  execFileSync('bash', ['-c', motif], { encoding: 'utf8' }).split('\n').filter(Boolean);

const noms = (fichiers) => {
  const trouves = new Set();
  for (const f of fichiers) {
    for (const m of readFileSync(f, 'utf8').matchAll(/PUBLIC_[A-Z_0-9]+/g)) trouves.add(m[0]);
  }
  return trouves;
};

const lus = noms(lire('grep -rl "PUBLIC_" src astro.config.mjs 2>/dev/null'));
const ecrits = noms(lire('ls .github/workflows/*.yml'));

/**
 * PUBLIC_NOINDEX n'existe que pour les préversions : il doit rester absent de
 * la production, sans quoi le site entier se retire de Google. Son absence des
 * workflows est donc voulue, et c'est la seule exception admise.
 */
const EXCEPTIONS = new Set(['PUBLIC_NOINDEX']);

const jamaisEcrits = [...lus].filter((n) => !ecrits.has(n) && !EXCEPTIONS.has(n)).sort();
const jamaisLus = [...ecrits].filter((n) => !lus.has(n)).sort();

console.log(`Réglages — ${lus.size} lus par le code, ${ecrits.size} écrits par les workflows\n`);

if (jamaisEcrits.length) {
  console.log(`⛔ ${jamaisEcrits.length} réglage(s) que le code attend et qu'aucun workflow ne fournit :\n`);
  for (const n of jamaisEcrits) console.log(`   ${n}`);
  console.log('\n   En production, ces valeurs seront vides. Selon le réglage, cela veut dire');
  console.log('   une publicité qui ne s\'affiche pas, un lien affilié sans commission,');
  console.log('   ou une vérification Search Console qui saute.\n');
}

if (jamaisLus.length) {
  console.log(`⚠  ${jamaisLus.length} réglage(s) écrit(s) par un workflow et lu(s) par personne :\n`);
  for (const n of jamaisLus) console.log(`   ${n}`);
  console.log('\n   Soit le nom est mal orthographié — et le vrai réglage est donc vide —,');
  console.log('   soit ce secret ne sert plus à rien et peut être retiré.\n');
}

if (!jamaisEcrits.length && !jamaisLus.length) console.log('✓ Les deux listes concordent.\n');

process.exit(jamaisEcrits.length || jamaisLus.length ? 1 : 0);
