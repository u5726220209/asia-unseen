#!/usr/bin/env node
/**
 * La sentinelle des chiffres publiés.
 *
 * Deux questions, à chaque passage :
 *
 *   1. Le montant figure-t-il encore sur la page source ?
 *      Sinon, un tarif a probablement changé, et nos phrases sont fausses.
 *
 *   2. Figure-t-il encore, à l'identique, sur nos pages ?
 *      Sinon, une correction a été faite à moitié — un chiffre mis à jour dans
 *      un article et oublié dans un autre. C'est la façon la plus courante de
 *      se contredire soi-même, et elle ne se voit jamais à la relecture.
 *
 * La première question demande le réseau. La seconde se répond hors ligne sur
 * `dist/`, et c'est celle qui doit bloquer une mise en ligne.
 */

import { readFileSync, existsSync } from 'node:fs';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const HORS_LIGNE = args.includes('--hors-ligne');
const JSON_OUT = args.includes('--json');

/* ── Lecture du registre ────────────────────────────────────────── */

const ts = readFileSync('src/data/chiffres-cites.ts', 'utf8');
const constantes = Object.fromEntries(
  [...ts.matchAll(/^const ([A-Z_0-9]+) = '([^']+)';$/gm)].map((m) => [m[1], m[2]]),
);
const resoudre = (v) => constantes[v] ?? v.replace(/^'|'$/g, '');

const chiffres = [...ts.matchAll(
  /\{ affiche: '([^']+)', designe: '([^']+)', source: ([A-Z_0-9]+), releveLe: '([^']+)', pages: \[([^\]]*)\]/g,
)].map((m) => ({
  affiche: m[1],
  designe: m[2],
  source: resoudre(m[3]),
  releveLe: m[4],
  pages: m[5].split(',').map((p) => resoudre(p.trim())).filter(Boolean),
}));

/**
 * Un montant s'écrit de plusieurs façons : « 28,82 », « 28.82 », « 1 199 »,
 * « 1199 ». On cherche toutes les formes, sinon on crie au loup à chaque
 * différence de séparateur de milliers.
 */
function formes(affiche) {
  const brut = affiche.replace(/[  ]/g, '');
  const s = new Set([affiche, brut, brut.replace(',', '.'), brut.replace('.', ',')]);
  if (/^\d{4,}$/.test(brut)) {
    s.add(brut.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
    s.add(brut.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
    s.add(brut.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  }
  return [...s];
}

const contient = (texte, affiche) => formes(affiche).some((f) => texte.includes(f));

/* ── 1. Cohérence interne, hors ligne ───────────────────────────── */

const manquantsSurLeSite = [];
if (existsSync('dist')) {
  for (const c of chiffres) {
    for (const page of c.pages) {
      const f = `dist${page}/index.html`;
      if (!existsSync(f)) { manquantsSurLeSite.push({ ...c, page, motif: 'page absente' }); continue; }
      const html = readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ');
      if (!contient(html, c.affiche)) manquantsSurLeSite.push({ ...c, page, motif: 'chiffre absent de la page' });
    }
  }
}

/* ── 2. Le chiffre tient-il encore à la source ? ─────────────────── */

const parSource = new Map();
for (const c of chiffres) {
  if (!parSource.has(c.source)) parSource.set(c.source, []);
  parSource.get(c.source).push(c);
}

const disparusDeLaSource = [];
const sourcesMuettes = [];

if (!HORS_LIGNE) {
  for (const [url, liste] of parSource) {
    let texte = null;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25_000);
      const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) texte = (await r.text()).replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ');
    } catch { /* la source ne répond pas : traité plus bas */ }

    if (texte === null) { sourcesMuettes.push(url); continue; }
    for (const c of liste) if (!contient(texte, c.affiche)) disparusDeLaSource.push(c);
  }
}

/* ── Rapport ────────────────────────────────────────────────────── */

if (JSON_OUT) {
  console.log(JSON.stringify({
    surveilles: chiffres.length,
    incoherencesInternes: manquantsSurLeSite,
    disparusDeLaSource: disparusDeLaSource.map(({ affiche, designe, source, pages }) => ({ affiche, designe, source, pages })),
    sourcesMuettes,
  }, null, 2));
} else {
  console.log(`Chiffres publiés — ${chiffres.length} montants suivis\n`);

  if (manquantsSurLeSite.length) {
    console.log(`⛔ ${manquantsSurLeSite.length} incohérence(s) dans le site lui-même :\n`);
    for (const m of manquantsSurLeSite) console.log(`   ${m.affiche.padEnd(12)} ${m.motif.padEnd(28)} ${m.page}\n      ${m.designe}`);
    console.log('\n   Un montant déclaré au registre a disparu de la page qui le citait.');
    console.log('   Soit la page a changé sans le registre, soit l\'inverse.\n');
  } else {
    console.log('✓ Tous les montants déclarés figurent bien sur les pages annoncées.\n');
  }

  if (disparusDeLaSource.length) {
    console.log(`⚠  ${disparusDeLaSource.length} montant(s) ne figurent plus sur leur source :\n`);
    for (const c of disparusDeLaSource) {
      console.log(`   ${c.affiche}  —  ${c.designe}`);
      console.log(`   relevé le ${c.releveLe} sur ${c.source}`);
      console.log(`   affirmé sur : ${c.pages.join(', ')}\n`);
    }
    console.log('   Ouvrez la source, relevez le nouveau montant, corrigez les pages');
    console.log('   citées, mettez le registre à jour et remontez la date de relevé.\n');
  } else if (!HORS_LIGNE) {
    console.log('✓ Tous les montants tiennent encore à leur source.\n');
  }

  if (sourcesMuettes.length) {
    console.log(`   ${sourcesMuettes.length} source(s) n'ont pas répondu — souvent un blocage anti-robot :`);
    for (const u of sourcesMuettes) console.log(`     ${u}`);
    console.log();
  }
}

// Trois issues distinctes, parce qu'elles appellent trois réactions :
//   1 — incohérence interne : c'est notre faute, elle est réparable tout de
//       suite, et elle doit bloquer une mise en ligne ;
//   2 — un montant a disparu de sa source : il faut aller lire le nouveau
//       tarif, ce qui demande un jugement humain. On alerte sans bloquer ;
//   0 — rien à signaler.
process.exit(manquantsSurLeSite.length ? 1 : disparusDeLaSource.length ? 2 : 0);
