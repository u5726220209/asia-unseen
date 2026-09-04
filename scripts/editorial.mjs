#!/usr/bin/env node
/**
 * Le point du lundi.
 *
 * Les autres contrôles disent ce qui ne va pas. Celui-ci dit quoi faire — ce
 * qui est une question différente, et la seule qui compte un lundi matin.
 *
 * Il répond à trois questions dans l'ordre où elles se posent :
 *
 *   · qu'est-ce qui part cette semaine sans que j'aie rien à faire ?
 *   · où le site est-il mince ? Un pays avec un seul article ne se classera
 *     sur rien : Google range les sites par sujet, et un sujet traité une
 *     fois n'est pas un sujet traité.
 *   · quelles pages personne ne peut atteindre ? Une page sans lien entrant
 *     est invisible pour le lecteur comme pour le robot, même si elle est
 *     dans le plan du site.
 *
 * Il ne bloque jamais rien. Un rappel qui bloque devient un obstacle, et un
 * obstacle finit désactivé.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const pays = [...readFileSync('src/data/countries.ts', 'utf8').matchAll(/slug: '([a-z-]+)'/g)].map((m) => m[1]);

/* ── 1. Ce qui part tout seul ────────────────────────────────────── */

const programme = execFileSync('node', ['scripts/programme.mjs'], { encoding: 'utf8' });

/* ── 2. Où le site est mince ─────────────────────────────────────── */

const articles = [];
for (const dossier of ['src/content/blog', 'src/content/guides']) {
  for (const f of readdirSync(dossier).filter((f) => f.endsWith('.md'))) {
    const md = readFileSync(`${dossier}/${f}`, 'utf8');
    const entete = md.slice(0, md.indexOf('\n---', 4));
    if (/^draft:\s*true/m.test(entete)) continue;
    articles.push({
      fichier: `${dossier}/${f}`,
      titre: entete.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? f,
      pays: (entete.match(/^pays:\s*\[(.*)\]/m)?.[1] ?? '')
        .split(',').map((p) => p.trim().replace(/['"]/g, '')).filter(Boolean),
      mots: md.split(/\s+/).length,
    });
  }
}

/**
 * Compter tous les articles qui mentionnent un pays donne une image fausse :
 * un guide des visas liste les neuf, sans rendre aucun des neuf profond. Ce
 * qui classe un site sur « voyage en Corée », c'est le nombre d'articles dont
 * la Corée est le sujet. On sépare donc les deux — un article portant sur au
 * plus deux pays traite d'eux ; au-delà, c'est un guide transversal.
 */
const couverture = pays
  .map((p) => ({
    pays: p,
    dedies: articles.filter((a) => a.pays.includes(p) && a.pays.length <= 2).length,
    transversaux: articles.filter((a) => a.pays.includes(p) && a.pays.length > 2).length,
  }))
  .sort((a, b) => a.dedies - b.dedies);

/* ── 3. Les pages que personne n'atteint ─────────────────────────── */

let orphelines = [];
let mediane = 0;
if (existsSync('dist')) {
  const pages = execFileSync('bash', ['-c', 'find dist -name "index.html"'], { encoding: 'utf8' })
    .split('\n').filter(Boolean)
    .map((f) => '/' + f.replace(/^dist\/?/, '').replace(/index\.html$/, '').replace(/\/$/, ''))
    .filter((u) => u !== '/');

  const entrants = new Map(pages.map((p) => [p, 0]));
  const html = execFileSync('bash', ['-c', 'cat $(find dist -name "index.html")'], {
    encoding: 'utf8', maxBuffer: 200 * 1024 * 1024,
  });
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    const u = m[1].replace(/\/$/, '') || '/';
    if (entrants.has(u)) entrants.set(u, entrants.get(u) + 1);
  }
  /**
   * Le seuil ne peut pas être un chiffre arbitraire : il dépend de ce que le
   * menu et le pied de page lient déjà. On le prend relatif à la médiane du
   * site — une page qui reçoit cinq fois moins de liens que la moyenne des
   * autres est vraiment en marge, quel que soit le nombre absolu.
   */
  const classement = [...entrants].sort((a, b) => a[1] - b[1]);
  mediane = classement[Math.floor(classement.length / 2)]?.[1] ?? 0;
  orphelines = classement.filter(([, n]) => n <= Math.max(2, mediane / 5));
}

/* ── Rapport ────────────────────────────────────────────────────── */

const lignes = [];
lignes.push('## Ce qui part tout seul cette semaine', '', '```', programme.trim(), '```', '');

lignes.push('## Où le site est mince', '');
lignes.push('| Pays | Articles dédiés | Cités dans un guide |', '| --- | --- | --- |');
for (const c of couverture) lignes.push(`| ${c.pays} | ${c.dedies} | ${c.transversaux} |`);
const maigres = couverture.filter((c) => c.dedies <= 1);
lignes.push('');
if (maigres.length) {
  lignes.push(
    `**${maigres.length} pays n'ont qu'un article dédié ou aucun** : ${maigres.map((m) => m.pays).join(', ')}.`,
    '',
    'Un pays traité une seule fois ne se classera sur rien. Le raccourci le plus',
    'rentable est d\'en épaissir un plutôt que d\'en ouvrir un dixième : trois ou',
    'quatre articles qui se répondent valent mieux que douze pages isolées.',
    '',
  );
} else {
  lignes.push('Chaque pays a au moins deux articles qui lui sont consacrés.', '');
}

lignes.push('## Pages sans lien entrant', '');
if (orphelines.length) {
  lignes.push(`La page médiane du site reçoit **${mediane} liens internes**. Celles-ci en reçoivent bien moins :`, '');
  for (const [u, n] of orphelines.slice(0, 15)) lignes.push(`- \`${u}\` — ${n} lien(s) entrant(s)`);
  lignes.push('', 'Un lien depuis un article qui parle du même sujet vaut plus qu\'une entrée de menu.', '');
} else {
  lignes.push('Aucune. Chaque page est liée depuis au moins trois endroits.', '');
}

/* ── 4. Les pages qui promettent des sources et n'en citent aucune ─ */

/**
 * La page d'accueil affirme : « les sources sont citées et cliquables ».
 * Un guide sans source ne porte donc pas seulement un manque — il contredit
 * la promesse affichée à l'entrée du site, et il n'affiche même pas de date
 * de vérification, puisque le bandeau ne s'affiche que s'il y a des sources.
 *
 * On ne peut pas inventer une source : la trouver, la lire et la citer est
 * un travail de jugement. Mais on peut refuser de l'oublier.
 */
/**
 * Nuance apportée après coup : un guide de conseils n'a pas de source à citer.
 * Le contrôle nommait indistinctement les huit guides sans bloc `sources`, et
 * quatre d'entre eux — quel quartier choisir, quand partir, quel budget viser —
 * n'auraient jamais pu en produire une honnête. Un rappel qui demande
 * l'impossible finit ignoré, et emporte avec lui les quatre autres, qui eux le
 * méritaient. Seules les pages déclarées `nature: factuel` sont donc comptées.
 */
const sansSource = [];
for (const f of readdirSync('src/content/guides').filter((f) => f.endsWith('.md'))) {
  const entete = readFileSync(`src/content/guides/${f}`, 'utf8').split('---')[1] ?? '';
  if (/^nature:\s*editorial/m.test(entete)) continue;
  if (!/^sources:/m.test(entete)) sansSource.push(f.replace(/\.md$/, ''));
}

lignes.push('## Guides qui ne citent aucune source', '');
if (sansSource.length) {
  lignes.push(
    `**${sansSource.length} guide(s) factuel(s)** n'ont pas de bloc \`sources:\` :`,
    '',
  );
  for (const g of sansSource) lignes.push(`- \`/${g}\``);
  lignes.push(
    '',
    "Ces pages n'affichent aucun bandeau de vérification — le bandeau dépend",
    "des sources. Elles contredisent donc la promesse faite en page d'accueil,",
    '« les sources sont citées et cliquables », sur le site qui en fait son',
    'argument principal. Une source par guide suffit à refermer l\'écart.',
    '',
  );
} else {
  lignes.push('Aucun. Chaque guide cite au moins une source vérifiable.', '');
}

lignes.push(
  '## Rappel',
  '',
  'Ce rapport ne bloque rien et ne corrige rien. Il indique où une heure de',
  'travail rapporte le plus cette semaine.',
);

const texte = lignes.join('\n');
if (process.argv.includes('--markdown')) console.log(texte);
else console.log(texte.replace(/^\| /gm, '   ').replace(/\|/g, ' '));
