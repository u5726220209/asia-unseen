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
import { PREFIXES } from './lib/collections.mjs';

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
  /**
   * Pourquoi ce montant est une estimation, quand il en est une.
   *
   * Le champ existait dans le registre et n'était lu qu'à travers
   * `nonRelisable` — c'est-à-dire réduit à un booléen. Le contrôle écrit
   * ensuite pour vérifier que ces estimations se présentent au lecteur comme
   * telles filtrait donc sur `c.estimation`, toujours indéfini : il examinait
   * zéro entrée et annonçait « ✓ » avec aplomb.
   *
   * C'est la panne que toute cette mécanique existe pour empêcher, et elle
   * s'est produite dans le contrôle lui-même. Elle n'a été vue qu'en cassant
   * délibérément la page, ce qui est précisément la raison d'être des
   * garde-fous : un contrôle qu'on n'a pas vu échouer n'est pas un contrôle.
   */
  estimation: m[0].match(/estimation:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/)?.slice(1).find(Boolean) ?? null,
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
const programmees = new Map();
{
  const aujourdhui = new Date().toISOString().slice(0, 10);
  /**
   * Le préfixe d'URL de chaque collection.
   *
   * Il était déduit du nom du dossier — « contient blog, donc /blog/ ». La
   * collection anglaise s'appelle blog-en et sert sous /en/blog/ : la déduction
   * la rangeait sous /blog/, aucune page programmée n'était reconnue, et le
   * contrôle réclamait des pages qui n'existent pas encore. Une règle écrite
   * vaut mieux qu'une devinette sur un nom de dossier.
   */
  for (const [dossier, prefixe] of Object.entries(PREFIXES)) {
    if (!existsSync(dossier)) continue;
    for (const f of readdirSync(dossier).filter((f) => f.endsWith('.md'))) {
      const entete = readFileSync(`${dossier}/${f}`, 'utf8').slice(0, 1400);
      const date = entete.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
      if (date && date > aujourdhui) {
        programmees.set(`${prefixe}${f.replace(/\.md$/, '')}`, `${dossier}/${f}`);
      }
    }
  }
}

const manquantsSurLeSite = [];
const enAttenteDeParution = [];
if (existsSync('dist')) {
  for (const c of chiffres) {
    for (const page of c.pages) {
      /*
       * Une page programmée n'a pas de HTML, mais elle a son markdown — et
       * c'est là que le montant est écrit. Se contenter de la mettre en
       * attente laissait une fenêtre : un chiffre inscrit au registre pour un
       * guide qui paraît dans onze semaines n'était vérifié qu'onze semaines
       * plus tard, le matin de la parution, quand personne ne relit plus. On
       * lit donc la source en attendant la page.
       */
      if (programmees.has(page)) {
        const md = readFileSync(programmees.get(page), 'utf8');
        if (!contient(md, c.affiche)) {
          manquantsSurLeSite.push({ ...c, page, motif: 'absent du texte programmé' });
        } else {
          enAttenteDeParution.push({ ...c, page });
        }
        continue;
      }
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

/* ── 1 bis-2. Une estimation doit se présenter comme telle ───────── */

/**
 * Ce que le registre promet au nom de la page.
 *
 * Le champ `estimation` dit pourquoi un montant n'est pas un tarif relevé —
 * une conversion de devise, un total dont la grille n'est pas publique — et
 * il désactive la relecture à la source, puisqu'aucune source ne publie ce
 * nombre. Le commentaire d'une de ces entrées va plus loin : « et la page le
 * dit ».
 *
 * C'est une promesse faite au nom d'une page que le registre ne lit pas. Elle
 * se vérifie aujourd'hui — « environ 110 € », « ≈ 7,50 € » — et rien ne la
 * tient. Retirer le mot « environ » ne casserait rien : le montant resterait
 * juste, la page se mettrait à l'affirmer, et le registre continuerait de
 * promettre le contraire.
 *
 * Ce dépôt a déjà connu exactement cela, à l'envers : une correction publiée
 * annonçait au lecteur qu'un garde-fou existait, et il n'existait pas.
 */
const estimationsSeches = [];
{
  const HEDGE = /environ|≈|~|ordre de grandeur|about|approximately|roughly|autour de/i;
  for (const c of chiffres.filter((x) => x.estimation)) {
    for (const page of c.pages) {
      if (programmees.has(page)) continue;
      const f = `dist${page}/index.html`;
      if (!existsSync(f)) continue;
      const texte = readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      /* Toutes les occurrences, pas la première : un montant court comme
         « 110 » apparaît volontiers ailleurs dans une page — dans un autre
         nombre, dans une classe, dans un identifiant. Ne regarder que la
         première revient à juger un voisinage qui n'est pas le bon, et le
         verdict est alors juste par accident. */
      const trouve = [];
      for (const forme of formes(c.affiche)) {
        let i = texte.indexOf(forme);
        while (i >= 0) { trouve.push(i); i = texte.indexOf(forme, i + 1); }
      }
      if (!trouve.length) continue; // déjà signalé par le contrôle de présence
      const voisinage = trouve.some((i) => HEDGE.test(texte.slice(Math.max(0, i - 90), i + 40)));
      if (!voisinage) estimationsSeches.push({ ...c, page });
    }
  }
}

/* ── 1 ter. Un montant en devise publié hors registre ────────────── */

/**
 * La question que le registre ne se posait pas sur lui-même.
 *
 * Il vérifie que ce qu'il déclare figure bien sur les pages, et qu'aucune
 * forme périmée ne traîne. Il ne demandait jamais l'inverse : ce que les
 * pages publient est-il déclaré ?
 *
 * Le pass d'Angkor a vécu ainsi. « 62 USD » figurait sur deux pages depuis
 * l'ouverture et dans aucune entrée du registre — un tarif officiel, juste,
 * et que personne ne relisait. Il serait devenu faux le jour d'une
 * augmentation, sur deux pages à la fois, sans un mot.
 *
 * On cherche les montants en devise étrangère, parce que c'est la signature
 * d'un tarif relevé : le site chiffre ses propres estimations en euros et
 * cite les tarifs officiels dans la monnaie où ils sont publiés. Un montant
 * en bahts, en dongs ou en wons vient donc presque toujours d'un guichet.
 *
 * La comparaison passe par `formes()`, la même que le reste du fichier : une
 * seconde normalisation aurait divergé de la première, et ce dépôt a déjà
 * payé ce prix ailleurs — « 10,50 » au registre, « 10.50 » dans le texte
 * anglais, et un contrôle qui croit avoir trouvé un défaut.
 */
const DEVISES = 'USD|THB|VND|IDR|PHP|KRW|CNY|JPY|LAK|bahts?|dongs?|roupies?|wons?|yens?|yuans?|pesos?|kips?|riels?';
const horsRegistre = [];
{
  const toutesFormes = chiffres.flatMap((c) => formes(c.affiche));
  const sansTarif = [
    ...readFileSync('src/data/chiffres-cites.ts', 'utf8')
      .matchAll(/\{ montant: '([^']+)', pourquoi:/g),
  ].flatMap((m) => formes(m[1]));
  const motif = new RegExp(`(\\d[\\d\u00a0\u202f ,.]*\\d|\\d)\\s*(?:${DEVISES})\\b`, 'gi');

  for (const dossier of Object.keys(PREFIXES)) {
    if (!existsSync(dossier)) continue;
    for (const f of readdirSync(dossier).filter((x) => x.endsWith('.md'))) {
      const texte = readFileSync(`${dossier}/${f}`, 'utf8');
      for (const m of texte.matchAll(motif)) {
        const montant = m[1].trim();
        /* Un montant à un ou deux chiffres est le plus souvent une durée ou un
           ordre de grandeur en prose — « 20 bahts », « 60 USD la journée ».
           Les tarifs relevés qui comptent ici en ont davantage, ou une
           décimale. */
        const chiffresSeuls = montant.replace(/[^\d]/g, '');
        if (chiffresSeuls.length < 3 && !/[.,]/.test(montant)) continue;
        if (toutesFormes.some((forme) => montant === forme)) continue;
        if (toutesFormes.some((forme) => contient(montant, forme) && forme.length >= montant.length - 1)) continue;
        /* Les montants que le registre déclare explicitement ne pas être des
           tarifs : une fourchette, un taux de change, une addition maison. */
        if (sansTarif.some((forme) => montant === forme)) continue;
        horsRegistre.push({ montant: m[0].trim(), fichier: `${dossier}/${f}` });
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
if (estimationsSeches.length) {
  console.log(`⛔ ${estimationsSeches.length} estimation(s) affichées comme des tarifs :\n`);
  for (const e of estimationsSeches.slice(0, 10)) {
    console.log(`   ${e.affiche.padEnd(10)} ${e.page}`);
    console.log(`      ${e.estimation}`);
  }
  console.log('\n   Le registre promet que la page dit que ce montant est approché.');
  console.log('   Elle ne le dit pas : « environ », « ≈ » ou « autour de » manquent.\n');
} else {
  console.log('✓ Chaque estimation se présente au lecteur comme une estimation.\n');
}

if (horsRegistre.length) {
  const vus = new Set();
  const uniques = horsRegistre.filter((h) => !vus.has(h.montant + h.fichier) && vus.add(h.montant + h.fichier));
  console.log(`⛔ ${uniques.length} montant(s) en devise publiés hors registre :\n`);
  for (const h of uniques.slice(0, 15)) console.log(`   ${h.montant.padEnd(16)} ${h.fichier}`);
  console.log('\n   Un tarif publié sans être inscrit est un tarif que personne ne relit.');
  console.log("   Inscrivez-le, ou marquez-le comme estimation s'il n'en est pas un.\n");
} else {
  console.log('✓ Chaque montant en devise publié est inscrit au registre.\n');
}

process.exit(manquantsSurLeSite.length || contradictions.length || horsRegistre.length || estimationsSeches.length ? 1 : disparusDeLaSource.length ? 2 : 0);
