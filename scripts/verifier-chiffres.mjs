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

import { readFileSync, readdirSync, existsSync } from 'node:fs';

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

/**
 * Le libellé peut être entre guillemets doubles et contenir une apostrophe,
 * ou entre apostrophes avec une apostrophe échappée. L'ancien motif ne savait
 * lire ni l'un ni l'autre : il sautait l'entrée en silence, et le montant
 * passait pour surveillé alors que personne ne le regardait. Trois tarifs de
 * visa étaient dans ce cas le jour où ils ont été inscrits.
 */
const chiffres = [...ts.matchAll(
  /\{ affiche: '([^']+)', designe: (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'), source: ([A-Z_0-9]+), releveLe: '([^']+)', pages: \[([^\]]*)\][^}]*\}/g,
)].map((m) => ({
  affiche: m[1],
  designe: m[2] ?? m[3],
  source: resoudre(m[4]),
  releveLe: m[5],
  pages: m[6].split(',').map((p) => resoudre(p.trim())).filter(Boolean),
  // Certaines sources calculent leurs prix dans le navigateur : le montant
  // existe à l'écran mais pas dans le HTML. Les traiter comme disparus
  // produirait seize fausses alertes chaque matin, et une sentinelle qui crie
  // sans raison finit ignorée — donc pire qu'absente.
  // Une estimation assumée — une conversion de devise, un total dont la
  // grille n'est pas publique — n'a pas à être retrouvée à la source. La
  // relire chaque matin produirait une alerte permanente sur un écart normal.
  nonRelisable: /sourceIntrouvableAttendue:\s*true/.test(m[0]) || /estimation:/.test(m[0]),
  // Les formes fausses que ce chiffre remplace. Déclarées en clair dans le
  // registre, elles ne sont pas résolues par `resoudre` : ce sont des
  // fragments de phrase, pas des constantes d'URL.
  contredit: (m[0].match(/contredit:\s*\[([^\]]*)\]/)?.[1] ?? '')
    .split(',').map((v) => v.trim().replace(/^'|'$/g, '')).filter(Boolean),
}));

/**
 * Le registre doit être lu en entier, ou pas du tout.
 *
 * Une entrée que le motif ne sait pas lire disparaît sans bruit : elle est
 * inscrite, elle a l'air surveillée, et rien ne la regarde. C'est le défaut le
 * plus vicieux possible pour une sentinelle, parce qu'il se présente comme un
 * succès. On compare donc ce qui est déclaré à ce qui est lu, et on refuse de
 * tourner en cas d'écart.
 */
{
  const declares = (ts.match(/^\s*\{ affiche: '/gm) ?? []).length;
  if (chiffres.length !== declares) {
    console.error(`⛔ Registre illisible : ${declares} montants inscrits, ${chiffres.length} relus.`);
    console.error('   Une entrée que ce contrôle ne sait pas lire passe pour surveillée');
    console.error('   alors que personne ne la regarde. Corrigez le motif de lecture');
    console.error("   avant d'aller plus loin — ne corrigez pas l'entrée pour lui plaire.\n");
    process.exit(1);
  }
}

/**
 * Un montant s'écrit de plusieurs façons : « 28,82 », « 28.82 », « 1 199 »,
 * « 1199 ». On cherche toutes les formes, sinon on crie au loup à chaque
 * différence de séparateur de milliers.
 *
 * Le point comme séparateur de milliers a été ajouté après une fausse alerte :
 * France Diplomatie écrit « 150.000 roupies » là où nous écrivons « 150 000 ».
 * Une sentinelle qui signale des écarts inexistants finit ignorée, ce qui la
 * rend pire qu'inutile.
 */
function formes(affiche) {
  const brut = affiche.replace(/[  ]/g, '');
  const s = new Set([affiche, brut, brut.replace(',', '.'), brut.replace('.', ',')]);
  if (/^\d{4,}$/.test(brut)) {
    // Tous les séparateurs de milliers rencontrés dans la nature : espace fine,
    // espace insécable, espace ordinaire, virgule, point, apostrophe. Le point a
    // été ajouté après une fausse alerte — France Diplomatie écrit
    // « 150.000 roupies » là où nous écrivons « 150 000 ». Une sentinelle qui
    // signale des écarts inexistants finit ignorée, ce qui la rend pire qu'inutile.
    for (const sep of [' ', '\u202f', '\u00a0', ',', '.', "'"]) {
      s.add(brut.replace(/\B(?=(\d{3})+(?!\d))/g, sep));
    }
  }
  return [...s];
}

const contient = (texte, affiche) => formes(affiche).some((f) => texte.includes(f));

/* ── 1. Cohérence interne, hors ligne ───────────────────────────── */

/**
 * Les pages qui n'existent pas encore parce qu'elles attendent leur date.
 *
 * Un article programmé n'a pas de page tant que le jour n'est pas venu, et ses
 * montants sont pourtant déjà déclarés — c'est même souhaitable, la sentinelle
 * les surveille avant même la parution. Les compter comme des incohérences
 * transformerait la programmation en défaut, alors qu'elle marche exactement
 * comme prévu.
 */
const programmees = new Set();
{
  const aujourdhui = new Date().toISOString().slice(0, 10);
  for (const dossier of ['src/content/blog', 'src/content/guides']) {
    if (!existsSync(dossier)) continue;
    for (const f of readdirSync(dossier).filter((f) => f.endsWith('.md'))) {
      const entete = readFileSync(`${dossier}/${f}`, 'utf8').slice(0, 1400);
      const date = entete.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
      if (date && date > aujourdhui) {
        programmees.add(`/${dossier.includes('blog') ? 'blog/' : ''}${f.replace(/\.md$/, '')}`);
      }
    }
  }
}

const manquantsSurLeSite = [];
const enAttenteDeParution = [];
if (existsSync('dist')) {
  for (const c of chiffres) {
    for (const page of c.pages) {
      if (programmees.has(page)) { enAttenteDeParution.push({ ...c, page }); continue; }
      const f = `dist${page}/index.html`;
      if (!existsSync(f)) { manquantsSurLeSite.push({ ...c, page, motif: 'page absente' }); continue; }
      const html = readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ');
      if (!contient(html, c.affiche)) manquantsSurLeSite.push({ ...c, page, motif: 'chiffre absent de la page' });
    }
  }
}

/* ── 1 bis. Une forme fausse traîne-t-elle encore quelque part ? ── */

/**
 * La question inverse de la précédente, et celle qui manquait.
 *
 * Vérifier qu'un montant figure là où on l'attend ne dit rien de ce qui se dit
 * ailleurs. « 32 h 45 » était bien présent sur ses trois pages ; « 33 heures »
 * vivait pendant ce temps dans les données du Vietnam, donc sur la fiche pays
 * et sur sa version imprimable. Le site se contredisait, et le contrôle
 * regardait exactement à côté.
 *
 * On balaie donc toutes les pages produites, à la recherche des formes que le
 * registre déclare périmées. Deux exclusions, et elles ne sont pas des
 * commodités :
 *
 *   — le journal des corrections cite l'avant et l'après, c'est son objet même ;
 *   — les pages d'un article programmé n'existent pas encore.
 */
const contradictions = [];
{
  const EXCLUES = new Set(['/mises-a-jour']);
  const declarees = chiffres.flatMap((c) =>
    c.contredit.map((forme) => ({ forme, attendu: c.affiche, designe: c.designe })),
  );

  if (existsSync('dist') && declarees.length) {
    const pages = [];
    const parcourir = (dir) => {
      for (const e of readdirSync(dir, { withFileTypes: true })) {
        const chemin = `${dir}/${e.name}`;
        if (e.isDirectory()) parcourir(chemin);
        else if (e.name === 'index.html') pages.push(chemin);
      }
    };
    parcourir('dist');

    for (const f of pages) {
      const url = f.replace(/^dist/, '').replace(/\/index\.html$/, '') || '/';
      if (EXCLUES.has(url)) continue;
      // L'encart « dernière correction » cite l'ancienne formulation sur la
      // page même qu'il corrige : le laisser dans le texte ferait crier le
      // contrôle sur la page la mieux corrigée du site. On retire l'encart,
      // pas la page — sinon on aveuglerait le contrôle là où il sert le plus.
      const texte = readFileSync(f, 'utf8')
        .replace(/<div data-correction[\s\S]*?<\/div>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&#39;|&rsquo;/g, "'")
        .replace(/&nbsp;|&#160;/g, ' ');
      for (const d of declarees) {
        // Le garde devant le chiffre évite qu'un « 133 heures » déclenche une
        // alerte pour « 33 heures ».
        const motif = new RegExp(`(?<![\\d,.])${d.forme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[  \\u202f\\u00a0]')}`);
        if (motif.test(texte)) contradictions.push({ ...d, page: url });
      }
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
/** Déclarés non relisables : on ne crie pas, mais on ne les oublie pas non plus. */
const aVerifierAlaMain = [];
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
    for (const c of liste) {
      if (contient(texte, c.affiche)) continue;
      (c.nonRelisable ? aVerifierAlaMain : disparusDeLaSource).push(c);
    }
  }
}

/* ── Rapport ────────────────────────────────────────────────────── */

if (JSON_OUT) {
  console.log(JSON.stringify({
    surveilles: chiffres.length,
    incoherencesInternes: manquantsSurLeSite,
    contradictions,
    disparusDeLaSource: disparusDeLaSource.map(({ affiche, designe, source, pages }) => ({ affiche, designe, source, pages })),
    aVerifierAlaMain: aVerifierAlaMain.length,
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

  if (contradictions.length) {
    console.log(`⛔ ${contradictions.length} page(s) affichent encore un chiffre corrigé :\n`);
    for (const c of contradictions) {
      console.log(`   ${c.page}`);
      console.log(`      dit encore « ${c.forme} » — la valeur retenue est « ${c.attendu} »`);
      console.log(`      ${c.designe}\n`);
    }
    console.log('   Une correction faite à moitié laisse le site se contredire lui-même,');
    console.log('   pendant que le journal des corrections annonce le contraire au lecteur.\n');
  } else {
    console.log('✓ Aucune page ne rappelle un chiffre corrigé.\n');
  }

  if (enAttenteDeParution.length) {
    const pages = [...new Set(enAttenteDeParution.map((c) => c.page))];
    console.log(`   ${enAttenteDeParution.length} montant(s) attendent la parution de ${pages.length} article(s) programmé(s) :`);
    for (const p of pages) console.log(`     ${p}`);
    console.log();
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

  if (aVerifierAlaMain.length) {
    console.log(`   ${aVerifierAlaMain.length} montant(s) sur des sources que seul un humain peut relire :`);
    const parSource = new Map();
    for (const c of aVerifierAlaMain) parSource.set(c.source, (parSource.get(c.source) ?? 0) + 1);
    for (const [u, n] of parSource) console.log(`     ${String(n).padStart(3)} × ${u}`);
    console.log('   Ces pages calculent leurs prix dans le navigateur. Rouvrez-les de temps');
    console.log('   en temps, à la main — le calendrier de fraîcheur vous le rappellera.\n');
  }

  if (sourcesMuettes.length) {
    console.log(`   ${sourcesMuettes.length} source(s) n'ont pas répondu — souvent un blocage anti-robot :`);
    for (const u of sourcesMuettes) console.log(`     ${u}`);
    console.log();
  }
}

// Trois issues distinctes, parce qu'elles appellent trois réactions :
//   1 — incohérence interne, dans les deux sens : un chiffre déclaré absent de
//       sa page, ou une page qui affiche encore une valeur corrigée. C'est
//       notre faute, c'est réparable tout de suite, et ça bloque la mise en
//       ligne — le journal des corrections promet au lecteur que ça bloque ;
//   2 — un montant a disparu de sa source : il faut aller lire le nouveau
//       tarif, ce qui demande un jugement humain. On alerte sans bloquer ;
//   0 — rien à signaler.
process.exit(manquantsSurLeSite.length || contradictions.length ? 1 : disparusDeLaSource.length ? 2 : 0);
