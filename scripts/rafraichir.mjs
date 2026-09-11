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

/**
 * Chaque fiche porte maintenant plusieurs dates, et elles n'appartiennent pas
 * au même objet.
 *
 * La fiche a la sienne, et chaque règle par passeport a la sienne. Ce script
 * cherchait « le premier `verifieLe` après le slug » — ce qui désignait la date
 * de la fiche tant que c'était la seule. Depuis que `regles` existe, le premier
 * rencontré est celui du passeport britannique. Le script aurait donc remonté
 * la date de la règle britannique sur la foi des sources françaises, pendant
 * que la fiche gardait une date figée : une date fausse à un endroit, immobile
 * à l'autre, et rien à l'écran pour le dire.
 *
 * Deux corrections, donc. La date de la fiche est celle qui suit
 * `sourcesVisa`, pas la première venue. Et chaque passeport est traité à part,
 * avec sa propre source : une règle britannique ne se vérifie pas en relisant
 * France Diplomatie.
 *
 * Le bloc s'arrête aussi au pays suivant, et non au bout de 9000 caractères.
 * Cette longueur arbitraire tenait tant qu'une fiche était courte ; les règles
 * par passeport les ont allongées, et une fenêtre fixe finit toujours par
 * couper au mauvais endroit ou déborder sur le voisin.
 */
const fiches = [];
const reglesPasseport = [];

for (const m of ts.matchAll(/slug: '([a-z-]+)'/g)) {
  const suivant = ts.slice(m.index + 1).search(/slug: '[a-z-]+'/);
  const finBloc = suivant < 0 ? ts.length : m.index + 1 + suivant;
  const bloc = ts.slice(m.index, finBloc);

  /* Les règles par passeport, chacune avec sa source et sa date. */
  const iRegles = bloc.indexOf('regles: {');
  if (iRegles >= 0) {
    for (const r of bloc.matchAll(
      /^\s{8}([a-z]{2}): \{[\s\S]*?source: \{[^}]*url: '([^']+)'[^}]*\},\s*\n\s*verifieLe: '([0-9-]+)'/gm,
    )) {
      const posDate = m.index + r.index + r[0].lastIndexOf("verifieLe: '");
      reglesPasseport.push({
        slug: m[1], passeport: r[1], url: r[2], date: r[3], position: posDate,
      });
    }
  }

  /* Les sources de la fiche, et la date qui les suit. */
  const i = bloc.indexOf('sourcesVisa: [');
  if (i < 0) continue;
  const seg = bloc.slice(i, bloc.indexOf('],', i));

  const urls = [];
  for (const s of seg.matchAll(BLOC)) {
    if (s[5] === 'false') continue;
    urls.push(s[3]);
  }

  /* La date de la fiche est celle qui suit ses sources, pas la première du bloc. */
  const apresSources = bloc.indexOf('],', i);
  const relatif = bloc.slice(apresSources).search(/verifieLe: '/);
  if (relatif < 0) continue;
  const dateAbs = apresSources + relatif;
  const date = bloc.slice(dateAbs).match(/verifieLe: '([0-9-]+)'/)?.[1] ?? null;
  fiches.push({ slug: m[1], urls, date, position: m.index + dateAbs });
}

/* ── L'autocontrôle : chaque position vise-t-elle le bon champ ? ── */

/**
 * Ce script écrit dans `countries.ts` en se repérant à des positions
 * calculées. Une position juste-à-côté ne produit pas d'erreur : elle écrit
 * une date exacte sur le mauvais champ, et le fichier reste valide.
 *
 * C'est arrivé. Le script cherchait « le premier `verifieLe` après le slug »,
 * ce qui désignait la date de la fiche tant que c'était la seule. L'arrivée des
 * règles par passeport a glissé cette première date vers celle du passeport
 * britannique : le script aurait remonté la date d'une règle britannique sur la
 * foi des sources françaises, en laissant la fiche figée. Le fichier aurait
 * compilé, le site aurait affiché une date, et elle aurait menti.
 *
 * Ce mode relit donc ses propres repères avant de s'en servir : pour chaque
 * position, il vérifie que le texte qui la précède est bien celui du champ
 * visé. Il sort en erreur sinon, ce qui le rend testable comme un contrôle.
 *
 *   node scripts/rafraichir.mjs --verifier
 */
if (args.includes('--verifier')) {
  const fautes = [];

  for (const f of fiches) {
    /* La date de la fiche vient après ses sources, et jamais à l'intérieur
       d'une règle par passeport. C'est la confusion qui s'est produite : les
       deux champs portent le même nom, et seul leur voisinage les distingue. */
    const avant = ts.slice(Math.max(0, f.position - 4000), f.position);
    if (!avant.includes('sourcesVisa: [')) {
      fautes.push(`${f.slug} : la date de la fiche ne suit pas ses sources`);
    }
    const dansUneRegle = reglesPasseport.some(
      (r) => r.slug === f.slug && Math.abs(r.position - f.position) < 4,
    );
    if (dansUneRegle) {
      fautes.push(`${f.slug} : la date de la fiche est celle d'une règle par passeport`);
    }
    if (!/^verifieLe: '[0-9-]+'/.test(ts.slice(f.position))) {
      fautes.push(`${f.slug} : la position ne tombe pas sur un verifieLe`);
    }
  }

  for (const r of reglesPasseport) {
    const avant = ts.slice(Math.max(0, r.position - 400), r.position);
    if (!avant.includes(r.url)) {
      fautes.push(`${r.slug}/${r.passeport} : la date ne suit pas la source ${r.url}`);
    }
    if (!/^verifieLe: '[0-9-]+'/.test(ts.slice(r.position))) {
      fautes.push(`${r.slug}/${r.passeport} : la position ne tombe pas sur un verifieLe`);
    }
  }

  const attendues = (ts.match(/verifieLe: '[0-9-]+'/g) ?? []).length;
  const trouvees = fiches.length + reglesPasseport.length;
  if (attendues !== trouvees) {
    fautes.push(`${attendues} dates dans le fichier, ${trouvees} repérées — ${attendues - trouvees} échappent au script`);
  }

  if (fautes.length) {
    console.error(`⛔ ${fautes.length} repère(s) mal placé(s) :\n`);
    for (const f of fautes) console.error(`   ${f}`);
    console.error('\n   Une position juste-à-côté écrit une date exacte sur le mauvais');
    console.error('   champ. Le fichier reste valide, et la date ment.\n');
    process.exit(1);
  }
  console.log(`✓ ${trouvees} dates repérées, chacune sur le champ qu'elle vise.`);
  process.exit(0);
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

/**
 * Les règles par passeport, chacune jugée sur sa propre source.
 *
 * Une règle britannique ne se vérifie pas en relisant France Diplomatie. Elle
 * a une source — GOV.UK — et c'est celle-là, et elle seule, qui décide si sa
 * date a le droit d'avancer. Les faire dépendre de la fiche aurait produit
 * exactement ce que ce script existe pour empêcher : une date qui affirme une
 * relecture qui n'a pas eu lieu.
 */
const passeportsARemonter = [];
const passeportsRetenus = [];

for (const r of reglesPasseport) {
  if (!inchangees.has(r.url)) {
    passeportsRetenus.push({
      ...r,
      motif: modifiees.has(r.url) ? 'a bougé' : injoignables.has(r.url) ? 'injoignable' : 'non relue',
    });
    continue;
  }
  if (r.date >= MOIS) { passeportsRetenus.push({ ...r, motif: 'déjà à jour' }); continue; }
  passeportsARemonter.push(r);
}

/* ── L'écriture ──────────────────────────────────────────────────── */

const ecritures = [...aRemonter, ...passeportsARemonter];

if (ecritures.length && !ESSAI) {
  // On écrit de la fin vers le début : chaque remplacement décale les
  // positions suivantes, et remonter le fichier à l'envers les préserve.
  let sortie = ts;
  for (const f of [...ecritures].sort((a, b) => b.position - a.position)) {
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

/* Les règles par passeport, comptées à part : elles ne dépendent pas des
   mêmes sources que la fiche, et les mêler cacherait le cas où la fiche
   remonte pendant qu'une règle reste bloquée sur un portail injoignable. */
if (passeportsARemonter.length) {
  console.log(`${ESSAI ? '→' : '✓'} ${passeportsARemonter.length} règle(s) par passeport ${ESSAI ? 'seraient remontées' : 'remontées'} à ${MOIS} :\n`);
  for (const r of passeportsARemonter) {
    console.log(`   ${`${r.slug}/${r.passeport}`.padEnd(20)} ${r.date} → ${MOIS}`);
  }
  console.log();
}

const ppBloquees = passeportsRetenus.filter((r) => r.motif !== 'déjà à jour');
if (ppBloquees.length) {
  console.log(`   ${ppBloquees.length} règle(s) par passeport laissées en l'état :\n`);
  for (const r of ppBloquees.slice(0, 12)) {
    console.log(`   ${`${r.slug}/${r.passeport}`.padEnd(20)} reste à ${r.date}   — ${r.motif}`);
  }
  console.log('\n   Une règle britannique ne se vérifie pas en relisant France');
  console.log('   Diplomatie : chacune dépend de sa propre source.\n');
}

// 0 quoi qu'il arrive : ne rien avoir à remonter n'est pas un échec, et une
// source qui a bougé est déjà signalée par la sentinelle elle-même.
process.exit(0);
