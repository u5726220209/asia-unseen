#!/usr/bin/env node
/**
 * Les garde-fous de la rédaction automatique.
 *
 *   npm run garde-fous
 *
 * Ce site publie des articles écrits par une machine, sans relecture humaine
 * avant mise en ligne. Chaque contrôle ci-dessous remplace un jugement humain
 * par une règle, et bloque au lieu d'avertir : un avertissement suppose
 * quelqu'un pour le lire, ce qui est précisément ce qui manque ici.
 *
 * Trois questions, dans l'ordre de gravité :
 *
 *   1. le rythme dépasse-t-il le plafond ? C'est la frontière entre publier
 *      régulièrement et produire en masse — la seconde se paie d'une
 *      désindexation, c'est-à-dire de la fin du site ;
 *   2. un article avance-t-il des faits sans source officielle ?
 *   3. les derniers articles se ressemblent-ils trop ? Cent textes issus du
 *      même procédé convergent vers la même forme, et un lecteur le sent sans
 *      savoir le nommer.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';

const ts = readFileSync('src/data/redaction.ts', 'utf8');
const nombre = (cle) => Number(ts.match(new RegExp(`${cle}: (\\d+(?:\\.\\d+)?)`))?.[1]);
const REGLAGES = {
  active: /active: true/.test(ts),
  parSemaine: nombre('parSemaine'),
  sourcesMinimales: nombre('sourcesMinimales'),
  varianceMaximale: nombre('varianceMaximale'),
  fenetre: nombre('fenetre'),
};

/* ── Lecture des articles ────────────────────────────────────────── */

const DOSSIER = 'src/content/blog';
const articles = readdirSync(DOSSIER)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const md = readFileSync(`${DOSSIER}/${f}`, 'utf8');
    const fin = md.indexOf('\n---', 4);
    const entete = md.slice(0, fin);
    const corps = md.slice(fin + 4);
    return {
      fichier: f,
      entete,
      corps,
      date: entete.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1] ?? '',
      auto: /^redactionAutomatique:\s*true/m.test(entete),
      brouillon: /^draft:\s*true/m.test(entete),
      sources: (entete.match(/^\s*- \{ label:/gm) ?? []).length,
      titres: [...corps.matchAll(/^## (.+)$/gm)].map((m) => m[1]),
      ouverture: corps.trim().split('\n')[0] ?? '',
    };
  })
  .filter((a) => !a.brouillon);

const auto = articles.filter((a) => a.auto).sort((a, b) => b.date.localeCompare(a.date));
const blocages = [];

/* ── 1. Le plafond hebdomadaire ──────────────────────────────────── */

const jours = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
const semaine = auto.filter((a) => a.date > jours(7) && a.date <= new Date().toISOString().slice(0, 10));

if (semaine.length > REGLAGES.parSemaine) {
  blocages.push({
    quoi: `${semaine.length} articles automatiques datés des sept derniers jours, plafond à ${REGLAGES.parSemaine}`,
    pourquoi: 'au-delà, le rythme ressemble à de la production de masse — sanctionnée par la désindexation',
    faire: 'repousser la date de parution des articles en trop, ils sortiront la semaine suivante',
  });
}

/* ── 2. Aucun fait sans source ───────────────────────────────────── */

for (const a of auto) {
  if (a.sources < REGLAGES.sourcesMinimales) {
    blocages.push({
      quoi: `${a.fichier} ne cite que ${a.sources} source(s), minimum ${REGLAGES.sourcesMinimales}`,
      pourquoi: "sans source, rien ne distingue cet article d'une opinion, et le site ne vaut plus rien",
      faire: 'ajouter les sources officielles au bloc « sources » de l\'en-tête, ou retirer l\'article',
    });
  }
}

/* ── 3. La variance de forme ─────────────────────────────────────── */

/** Similarité de Jaccard entre deux ensembles. */
const jaccard = (a, b) => {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  const commun = [...A].filter((x) => B.has(x)).length;
  return commun / (A.size + B.size - commun);
};

/** Les mots d'une phrase, réduits à leur forme comparable. */
const mots = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z]{4,}/g) ?? [];

const fenetre = auto.slice(0, REGLAGES.fenetre);
const paires = [];
for (let i = 0; i < fenetre.length; i++) {
  for (let j = i + 1; j < fenetre.length; j++) {
    // On compare la charpente, pas le sujet : les intertitres et la phrase
    // d'ouverture. Deux articles sur des pays différents peuvent partager tout
    // leur vocabulaire de voyage sans se ressembler ; s'ils partagent leur
    // plan et leur attaque, ils sont sortis du même moule.
    const s = (jaccard(fenetre[i].titres.flatMap(mots), fenetre[j].titres.flatMap(mots)) * 0.6)
            + (jaccard(mots(fenetre[i].ouverture), mots(fenetre[j].ouverture)) * 0.4);
    paires.push({ a: fenetre[i].fichier, b: fenetre[j].fichier, s });
  }
}

const tropProches = paires.filter((p) => p.s > REGLAGES.varianceMaximale).sort((a, b) => b.s - a.s);
for (const p of tropProches) {
  blocages.push({
    quoi: `${p.a} et ${p.b} partagent ${Math.round(p.s * 100)} % de leur charpente`,
    pourquoi: 'des articles coulés dans le même moule se repèrent, et font perdre la confiance du lecteur',
    faire: 'changer le plan et la phrase d\'ouverture de l\'un des deux',
  });
}

/* ── Rapport ────────────────────────────────────────────────────── */

if (!REGLAGES.active) {
  console.log('Rédaction automatique : COUPÉE dans src/data/redaction.ts.');
  console.log('Aucun article ne sera écrit ni publié automatiquement.\n');
}

console.log(`Garde-fous — ${auto.length} article(s) automatique(s) sur ${articles.length}\n`);
console.log(`   articles automatiques cette semaine   ${semaine.length} / ${REGLAGES.parSemaine}`);
console.log(`   sources par article, minimum observé  ${auto.length ? Math.min(...auto.map((a) => a.sources)) : '—'} / ${REGLAGES.sourcesMinimales}`);
console.log(`   ressemblance maximale entre deux      ${paires.length ? Math.round(Math.max(...paires.map((p) => p.s)) * 100) : 0} % / ${Math.round(REGLAGES.varianceMaximale * 100)} %\n`);

if (blocages.length) {
  console.log(`⛔ ${blocages.length} blocage(s) :\n`);
  for (const b of blocages) {
    console.log(`   ${b.quoi}`);
    console.log(`   pourquoi : ${b.pourquoi}`);
    console.log(`   à faire  : ${b.faire}\n`);
  }
} else {
  console.log('✓ Rien ne s\'oppose à la publication.\n');
}

process.exit(blocages.length ? 1 : 0);
