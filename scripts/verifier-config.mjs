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

import { readFileSync, existsSync } from 'node:fs';
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

/* ── Le formulaire produit est-il utilisable ? ──────────────────── */

/**
 * Des noms qui concordent ne suffisent pas : encore faut-il que la valeur
 * arrive jusqu'à la page.
 *
 * Le cas qui a motivé ce contrôle : `champEmail: env.PUBLIC_NEWSLETTER_CHAMP
 * ?? 'EMAIL'`. `??` ne se déclenche pas sur une chaîne vide, et un workflow
 * qui écrit `CHAMP=${secrets.CHAMP}` produit une chaîne vide quand le secret
 * n'existe pas. Le champ e-mail sortait donc avec un attribut `name` sans
 * valeur. Le formulaire partait, Brevo répondait, la page de remerciement
 * s'affichait — et pas une seule inscription n'était enregistrée. Rien, nulle
 * part, n'aurait signalé la perte.
 *
 * On ne relit donc pas le code : on relit le HTML produit.
 */
const defautsFormulaire = [];
if (existsSync('dist')) {
  const pages = execFileSync('bash', ['-c', 'ls dist/index.html dist/newsletter/index.html 2>/dev/null'], { encoding: 'utf8' })
    .split('\n').filter(Boolean);

  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    for (const champ of html.match(/<input[^>]*type="email"[^>]*>/g) ?? []) {
      const nom = champ.match(/\sname="([^"]*)"/)?.[1];
      if (!nom) defautsFormulaire.push({ page, motif: 'le champ e-mail n\'a pas de nom exploitable' });
    }
    // Un formulaire branché doit aussi porter html_type=simple, sans quoi Brevo
    // attend un script maison que ce site ne charge pas, et la redirection de
    // confirmation ne part jamais.
    const branche = /<form[^>]*class="au-nl[^>]*action="https?:/.test(html);
    if (branche && !html.includes('name="html_type" value="simple"')) {
      defautsFormulaire.push({ page, motif: 'formulaire branché sans html_type=simple' });
    }
  }
}

if (defautsFormulaire.length) {
  console.log(`⛔ ${defautsFormulaire.length} défaut(s) dans le formulaire d'inscription produit :\n`);
  for (const d of defautsFormulaire) console.log(`   ${d.motif}\n      ${d.page}`);
  console.log('\n   Une inscription partirait sans être enregistrée, et personne');
  console.log('   ne le verrait : la page de remerciement s\'affiche quand même.\n');
} else if (existsSync('dist')) {
  console.log('✓ Le formulaire produit porte un nom de champ et le type attendu.\n');
}

/* ── Le chiffre annoncé au lecteur est-il celui que la machine surveille ? ─ */

/**
 * La page « Devenir vérificateur » annonce « ce site relit chaque jour N pages
 * officielles ». C'est un argument de confiance : il doit être vrai.
 *
 * Le premier calcul en donnait seize là où la veille en lit vingt-cinq — il
 * oubliait les pages « Contacts utiles » déclarées sous `urgences.source`. Un
 * écart de cette nature ne se voit pas : les deux nombres sont plausibles, ils
 * vivent dans deux fichiers différents, et rien ne les confronte. D'où ce
 * contrôle, qui compare la phrase publiée à la liste réellement surveillée.
 */
let ecartSources = null;
if (existsSync('dist/verifier/index.html')) {
  const html = readFileSync('dist/verifier/index.html', 'utf8').replace(/<[^>]+>/g, ' ');
  const annonce = Number(html.match(/relit chaque jour\s+(\d+)\s+pages officielles/)?.[1]);

  const src = readFileSync('scripts/veille.mjs', 'utf8');
  const debut = src.indexOf('async function sourcesDuSite');
  const fin = src.indexOf('/* ── Normalisation');
  const extraire = new Function(
    'readFileSync', 'existsSync',
    src.slice(debut, fin).replace('async function sourcesDuSite', 'return async function sourcesDuSite'),
  )(readFileSync, existsSync);
  const reelles = (await extraire()).length;

  if (!Number.isFinite(annonce)) ecartSources = { annonce: 'introuvable', reelles };
  else if (annonce !== reelles) ecartSources = { annonce, reelles };
}

if (ecartSources) {
  console.log('⛔ Le nombre de sources annoncé au lecteur ne correspond pas à la réalité :\n');
  console.log(`   annoncé sur /verifier : ${ecartSources.annonce}`);
  console.log(`   réellement surveillé  : ${ecartSources.reelles}\n`);
  console.log('   Voir nbSourcesSurveillees dans src/lib/fraicheur.ts, qui doit compter');
  console.log('   exactement ce que sourcesDuSite() extrait dans scripts/veille.mjs.\n');
} else if (existsSync('dist/verifier/index.html')) {
  console.log('✓ Le nombre de sources annoncé est celui qui est surveillé.\n');
}

process.exit(jamaisEcrits.length || jamaisLus.length || defautsFormulaire.length || ecartSources ? 1 : 0);
