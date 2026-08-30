#!/usr/bin/env node
/**
 * Le budget de performance.
 *
 * Un site lent perd des lecteurs avant même d'être lu, et Google le sait : la
 * vitesse est un critère de classement. Or la lenteur n'arrive jamais d'un
 * coup. Elle s'installe : une image ajoutée sans être compressée, un script de
 * plus, une page qui grossit de dix kilo-octets à chaque révision. Personne ne
 * remarque la marche du jour, et un an plus tard le site est deux fois plus lourd.
 *
 * Un budget est le remède : on fixe les plafonds une fois, et la construction
 * échoue le jour où on les dépasse. Le refus arrive au moment où l'on sait
 * encore quel changement l'a causé — c'est-à-dire au seul moment où il est
 * facile à corriger.
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

/**
 * Les plafonds. Ils sont posés un cran au-dessus de la réalité du jour : assez
 * serrés pour attraper une dérive, assez larges pour ne pas se déclencher sur
 * un paragraphe ajouté.
 */
const BUDGET = {
  htmlPage: 120,      // Ko, page la plus lourde
  htmlMoyen: 75,      // Ko, moyenne
  jsPage: 60,         // Ko, JavaScript réellement chargé par la page la plus gourmande
  cssPage: 80,        // Ko, idem pour les feuilles de style

  /**
   * L'image la plus lourde servie. Le plafond était à 250 Ko quand le site
   * n'avait aucune photographie : il mesurait alors des illustrations
   * vectorielles. Il est relevé une fois, sciemment, parce que la nature du
   * site a changé — pas parce qu'un contrôle gênait. 400 Ko correspond à une
   * photographie pleine largeur de 1920 px, ce qui est le format servi aux
   * écrans de bureau ; les mobiles reçoivent la variante 640 px.
   */
  imagePage: 400,

  /**
   * Ce qu'un visiteur télécharge réellement sur la page la plus lourde :
   * son HTML, ses feuilles de style, son JavaScript et sa photographie.
   * C'est la seule mesure qui corresponde à une expérience vécue — le total
   * sur disque, lui, ne dit rien de ce que subit qui que ce soit.
   */
  pageComplete: 600,

  /**
   * Le poids total du dossier publié. Ce n'est pas une mesure d'expérience
   * mais de déploiement : personne ne télécharge tout le site. Il monte
   * mécaniquement avec chaque format supplémentaire — AVIF double le nombre
   * de variantes tout en allégeant ce qui est réellement servi.
   */
  imagesTotal: 16000,
};

if (!existsSync('dist')) {
  console.error('dist/ est absent : construisez le site d\'abord.');
  process.exit(1);
}

const ko = (o) => Math.round(o / 1024);
const lister = (motif) =>
  execFileSync('bash', ['-c', `find dist ${motif} -type f 2>/dev/null || true`], { encoding: 'utf8' })
    .split('\n').filter(Boolean);

const html = lister('-name "*.html"').map((f) => ({ f, o: statSync(f).size }));

/**
 * Ce qu'une page envoie vraiment.
 *
 * Additionner tous les .js du dossier serait une mesure fausse et rassurante à
 * l'envers : elle compte des fichiers que personne ne télécharge. Pagefind, par
 * exemple, dépose plusieurs habillages dont un seul est utilisé. On lit donc
 * dans chaque page ce qu'elle référence réellement, et on retient la pire —
 * c'est le poids que subit le visiteur le moins bien loti.
 */
function chargePar(page, extension) {
  const contenu = readFileSync(page, 'utf8');
  const motif = extension === 'js'
    ? /<script[^>]+src="([^"]+\.js)"/g
    : /<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css)"/g;
  let total = 0;
  for (const m of contenu.matchAll(motif)) {
    const chemin = m[1].startsWith('http') ? null : `dist${m[1].startsWith('/') ? '' : '/'}${m[1]}`;
    if (chemin && existsSync(chemin)) total += statSync(chemin).size;
  }
  return total;
}

const js = html.map(({ f }) => ({ f, o: chargePar(f, 'js') }));
const css = html.map(({ f }) => ({ f, o: chargePar(f, 'css') }));
const img = lister('\\( -name "*.webp" -o -name "*.jpg" -o -name "*.png" -o -name "*.avif" \\)')
  .map((f) => ({ f, o: statSync(f).size }));

const somme = (l) => l.reduce((a, b) => a + b.o, 0);
const pire = (l) => l.reduce((a, b) => (b.o > a.o ? b : a), { f: '—', o: 0 });

/** Ce qu'une page envoie en tout : son texte, son habillage et son image. */
const poidsPage = html.map(({ f, o }) => {
  const contenu = readFileSync(f, 'utf8');
  let image = 0;
  // La plus grande variante référencée : c'est celle que reçoit un écran large.
  for (const m of contenu.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      const chemin = `dist${u.startsWith('/') ? '' : '/'}${u}`;
      if (existsSync(chemin)) image = Math.max(image, statSync(chemin).size);
    }
  }
  return { f, o: o + chargePar(f, 'js') + chargePar(f, 'css') + image };
});

const mesures = [
  { nom: 'page HTML la plus lourde', valeur: ko(pire(html).o), budget: BUDGET.htmlPage, ou: pire(html).f },
  { nom: 'poids HTML moyen',         valeur: Math.round(somme(html) / html.length / 1024), budget: BUDGET.htmlMoyen },
  { nom: 'JS chargé, pire page',     valeur: ko(pire(js).o),  budget: BUDGET.jsPage,  ou: pire(js).f },
  { nom: 'CSS chargé, pire page',    valeur: ko(pire(css).o), budget: BUDGET.cssPage, ou: pire(css).f },
  { nom: 'image la plus lourde',     valeur: ko(pire(img).o), budget: BUDGET.imagePage, ou: pire(img).f },
  { nom: 'page complète, pire cas',  valeur: ko(pire(poidsPage).o), budget: BUDGET.pageComplete, ou: pire(poidsPage).f },
  { nom: 'dossier publié, images',   valeur: ko(somme(img)), budget: BUDGET.imagesTotal },
];

const depassements = mesures.filter((m) => m.valeur > m.budget);

/**
 * Le poids mort : des fichiers transférés à chaque mise en ligne et que
 * personne ne demande jamais. Ils ne ralentissent aucun visiteur, donc ils
 * n'entrent pas au budget — mais ils allongent le déploiement et brouillent
 * la lecture du dossier. On les signale, on ne bloque pas dessus.
 */
const references = new Set();
for (const { f } of html) {
  const contenu = readFileSync(f, 'utf8');
  // Les attributs src= et href=, mais aussi les import() écrits dans le code :
  // la recherche ne charge son moteur qu'au moment où on ouvre le champ, et
  // compter ce fichier comme mort serait une conclusion fausse.
  for (const m of contenu.matchAll(/(?:src|href)="([^"]+\.(?:js|css|jpe?g|png|webp|avif|svg))"/g)) references.add(m[1].replace(/^\//, ''));
  // Les images responsives ne vivent que dans un srcset : les oublier ferait
  // passer pour mortes toutes les variantes sauf la dernière.
  for (const m of contenu.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(/\s+/)[0];
      if (u) references.add(u.replace(/^\//, ''));
    }
  }
  // Les images de partage social ne sont jamais dans un src= : elles vivent
  // dans <meta property="og:image" content="…">. Les oublier faisait passer
  // pour mortes les quarante vignettes du site.
  for (const m of contenu.matchAll(/content="([^"]+\.(?:jpe?g|png|webp|avif|svg))"/g)) references.add(m[1].replace(/^https?:\/\/[^/]+\//, '').replace(/^\//, ''));
  for (const m of contenu.matchAll(/import\(["'`]([^"'`]+\.js)["'`]\)/g)) references.add(m[1].replace(/^\//, ''));
}
// pagefind.js démarre son propre worker et charge l'index : ce qu'il tire
// derrière lui n'apparaît dans aucune page, et n'est pas pour autant mort.
if (references.has('pagefind/pagefind.js')) {
  for (const f of ['pagefind/pagefind-worker.js', 'pagefind/wasm.unknown.pagefind']) references.add(f);
}
const jamaisCharges = lister('\\( -name "*.js" -o -name "*.css" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" -o -name "*.avif" \\)')
  .filter((f) => !references.has(f.replace(/^dist\//, '')))
  // Les icônes, le partage social et le plan du site sont demandés par le
  // navigateur ou par un robot, jamais par une balise de la page.
  .filter((f) => !/(favicon|icon-|apple-touch|og-|brand\/)/.test(f))
  .map((f) => ({ f, o: statSync(f).size }))
  .sort((a, b) => b.o - a.o);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ date: new Date().toISOString().slice(0, 10), mesures }, null, 2));
} else {
  console.log(`Budget de performance — ${html.length} pages\n`);
  for (const m of mesures) {
    const part = Math.round((m.valeur / m.budget) * 100);
    const marque = m.valeur > m.budget ? '⛔' : part > 85 ? '⚠' : '✓';
    console.log(`   ${marque} ${m.nom.padEnd(26)} ${String(m.valeur).padStart(5)} Ko / ${String(m.budget).padStart(5)} Ko   ${part} %`);
    if (m.ou && m.ou !== '—' && part > 85) console.log(`       ${m.ou}`);
  }
  console.log();
  if (depassements.length) {
    console.log(`⛔ ${depassements.length} plafond(s) dépassé(s).\n`);
    console.log('   Deux réponses possibles, et une seule est bonne selon le cas :');
    console.log('   alléger ce qui vient d\'être ajouté, ou relever sciemment le plafond');
    console.log('   dans scripts/performance.mjs si le poids est justifié. Relever un');
    console.log('   plafond sans y réfléchir revient à supprimer le contrôle.\n');
  } else {
    console.log('✓ Tout tient dans le budget.\n');
  }

  if (jamaisCharges.length) {
    const poids = ko(jamaisCharges.reduce((a, b) => a + b.o, 0));
    console.log(`   ${jamaisCharges.length} fichier(s), ${poids} Ko, livrés mais jamais chargés par aucune page :`);
    for (const j of jamaisCharges.slice(0, 5)) console.log(`     ${String(ko(j.o)).padStart(4)} Ko  ${j.f}`);
    console.log('   Ils ne ralentissent personne — ils alourdissent seulement le déploiement.\n');
  }
}

process.exit(depassements.length ? 1 : 0);
