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
  const pages = execFileSync('bash', ['-c', 'ls dist/index.html dist/newsletter/index.html dist/vietnam/index.html 2>/dev/null'], { encoding: 'utf8' })
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
    //
    // Le contrôle ne visait que la classe `au-nl`. La veille personnelle des
    // fiches pays porte `au-vp` : elle serait passée à travers, et c'est
    // exactement le genre d'angle mort qui rend un contrôle rassurant plutôt
    // qu'utile. On teste donc toute soumission vers un service externe.
    for (const f of html.match(/<form[^>]*action="https?:[^"]*"[^>]*>/g) ?? []) {
      if (!/class="au-(nl|vp)/.test(f)) continue;
      if (!html.includes('name="html_type" value="simple"')) {
        defautsFormulaire.push({ page, motif: 'formulaire branché sans html_type=simple' });
      }
    }

    // La date de départ doit partir au format que Brevo exige — jj-mm-aaaa, là
    // où <input type="date"> produit aaaa-mm-jj. Un attribut mal formé est
    // rejeté sans bruit : l'inscription réussit, la date se perd.
    //
    // Le contrôle cherchait d'abord la classe de conversion n'importe où dans
    // la page. Elle y figure aussi dans le script qui s'en sert, si bien qu'il
    // constatait sa propre existence et ne pouvait jamais échouer. On vise
    // maintenant la balise elle-même.
    for (const champ of html.match(/<input[^>]*name="DATE_DEPART"[^>]*>/g) ?? []) {
      if (!/au-vp-date-brevo/.test(champ)) {
        defautsFormulaire.push({ page, motif: 'DATE_DEPART sans conversion jj-mm-aaaa' });
      }
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

/* ── L'entier de l'exemption dit-il la même chose que la phrase ? ── */

/**
 * `visa.sansVisaJours` est transcrit de `visa.duree`. Deux écritures de la même
 * règle, dans le même objet, et rien ne les oblige à rester d'accord.
 *
 * Le jour où une exemption passe de soixante à trente jours, c'est la phrase
 * qu'on corrige — elle est lue par des humains, elle saute aux yeux. L'entier,
 * lui, ne se voit pas : il continuerait de répondre « aucun visa nécessaire »
 * pour un séjour de quarante jours devenu illégal. C'est le pire type d'erreur
 * que ce site puisse produire, et elle serait invisible.
 *
 * On vérifie donc que le nombre figure bien dans le texte. Zéro est le cas
 * particulier — « un visa est exigé dès le premier jour » ne s'écrit pas avec
 * un zéro — et se reconnaît à l'absence de « sans visa » dans la phrase.
 */
const visasIncoherents = [];
{
  const ts = readFileSync('src/data/countries.ts', 'utf8');
  for (const m of ts.matchAll(/slug: '([a-z-]+)'/g)) {
    const bloc = ts.slice(m.index, m.index + 8000);
    const i = bloc.indexOf('visa: {');
    if (i < 0) continue;
    const visa = bloc.slice(i, bloc.indexOf('\n    },', i));
    const duree = (visa.match(/duree:\s*"([^"]*)"/) ?? visa.match(/duree:\s*'([^']*)'/))?.[1] ?? '';
    const n = Number(visa.match(/sansVisaJours:\s*(\d+)/)?.[1] ?? NaN);
    if (!Number.isFinite(n)) { visasIncoherents.push({ pays: m[1], motif: 'sansVisaJours absent' }); continue; }

    const sansVisa = /sans visa|sans démarche|exemption/i.test(duree);
    if (n === 0 && sansVisa) {
      visasIncoherents.push({ pays: m[1], motif: 'annoncé à 0 alors que la phrase parle d\'exemption', duree });
    } else if (n > 0 && !new RegExp(`\\b${n}\\b`).test(duree)) {
      visasIncoherents.push({ pays: m[1], motif: `${n} ne figure pas dans la phrase`, duree });
    }
  }
}

if (visasIncoherents.length) {
  console.log(`⛔ ${visasIncoherents.length} règle(s) de visa où le chiffre et la phrase divergent :\n`);
  for (const v of visasIncoherents) {
    console.log(`   ${v.pays} — ${v.motif}`);
    if (v.duree) console.log(`      « ${v.duree.slice(0, 90)}… »`);
  }
  console.log('\n   L\'outil « Puis-je entrer ? » répondrait à partir du chiffre.');
  console.log('   Une divergence ici autorise un séjour que la règle interdit.\n');
} else {
  console.log('✓ Chaque durée d\'exemption chiffrée correspond à sa phrase.\n');
}

/* ── Une correction publiée a-t-elle vraiment été faite ? ────────── */

/**
 * Le journal des corrections affirme, pour chaque entrée, « le site disait
 * ceci, la source dit cela ». C'est la page la plus exigeante du site : elle
 * ne décrit pas une intention, elle atteste d'un fait accompli.
 *
 * Rien ne le vérifiait. Le 3 septembre 2026, une correction annonçant que
 * l'exemption thaïlandaise passait de soixante à trente jours a été publiée
 * pendant que la fiche pays affichait toujours l'ancienne règle — un script
 * avait échoué sur une assertion après avoir modifié le texte en mémoire,
 * sans jamais écrire le fichier. Le site se félicitait donc d'une correction
 * qu'il n'avait pas appliquée, sur sa page de confiance.
 *
 * Le contrôle est simple et il aurait suffi : si le texte cité comme « avant »
 * figure encore sur la page concernée, la correction n'a pas eu lieu.
 *
 * Les `avant` qui ne sont pas des phrases de la page — une adresse remplacée,
 * une source retirée — ne déclenchent naturellement rien, puisqu'ils n'y
 * figuraient pas non plus auparavant.
 */
const correctionsNonFaites = [];
if (existsSync('dist')) {
  const ts = readFileSync('src/data/corrections.ts', 'utf8');
  const propre = (t) =>
    t.replace(/\s+/g, ' ').replace(/[«»""'']/g, "'").trim();

  for (const m of ts.matchAll(/page: '([^']+)',[\s\S]{0,400}?avant:\s*\n?\s*"([^"]+)"/g)) {
    const page = m[1];
    const avant = propre(m[2]);
    // Trop court pour être discriminant : un fragment de trois mots se
    // retrouve partout et produirait de fausses alertes.
    if (avant.length < 40) continue;

    const f = `dist${page}/index.html`;
    if (!existsSync(f)) continue;
    const texte = propre(readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#39;|&rsquo;/g, "'"));
    if (texte.includes(avant)) correctionsNonFaites.push({ page, avant });
  }
}

if (correctionsNonFaites.length) {
  console.log(`⛔ ${correctionsNonFaites.length} correction(s) publiée(s) mais pas appliquée(s) :\n`);
  for (const c of correctionsNonFaites) {
    console.log(`   ${c.page}`);
    console.log(`   le texte cité comme « avant » figure encore sur la page :`);
    console.log(`   « ${c.avant.slice(0, 100)}… »\n`);
  }
  console.log('   Le journal des corrections atteste de faits accomplis, pas');
  console.log('   d\'intentions. Publier une correction non faite est la seule');
  console.log('   chose que cette page ne peut pas se permettre.\n');
} else if (existsSync('dist')) {
  console.log('✓ Chaque correction publiée est appliquée sur sa page.\n');
}

process.exit(
  jamaisEcrits.length || jamaisLus.length || defautsFormulaire.length ||
  ecartSources || visasIncoherents.length || correctionsNonFaites.length ? 1 : 0,
);
