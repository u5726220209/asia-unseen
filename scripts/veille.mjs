#!/usr/bin/env node
/**
 * La sentinelle.
 *
 * Elle surveille les pages officielles citées par le site — portails de visa,
 * conseils aux voyageurs, grilles tarifaires — et signale celles dont le
 * contenu a bougé depuis le dernier passage.
 *
 * CE QU'ELLE FAIT, ET CE QU'ELLE NE FERA JAMAIS
 * Elle dit « quelque chose a changé ici ». Elle ne dit pas « la nouvelle règle
 * est celle-ci », et elle ne modifie aucune page. Lire un texte administratif
 * ambigu et décider de ce qu'il faut écrire est un travail de jugement : c'est
 * précisément ce que ce site refuse d'automatiser, parce que c'est exactement
 * là que naissent les affirmations fausses.
 *
 * La machine surveille. L'humain tranche.
 *
 * Usage :
 *   node scripts/veille.mjs            # compare et rapporte
 *   node scripts/veille.mjs --init     # enregistre l'état actuel comme référence
 *   node scripts/veille.mjs --json     # sortie machine, pour l'intégration continue
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const EMPREINTES = 'src/data/veille-empreintes.json';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/**
 * En dessous de ce seuil, la page a été réécrite et mérite un œil, même si
 * aucun chiffre n'a bougé. Au-dessus, seuls les chiffres déclenchent l'alerte.
 */
const SEUIL_REECRITURE = 0.75;
/** Nombre de requêtes simultanées : au-delà, certains portails coupent. */
const PARALLELE = 4;

const args = process.argv.slice(2);
const INIT = args.includes('--init');
const JSON_OUT = args.includes('--json');

/* ── Les adresses surveillées, extraites des données du site ───── */

async function sourcesDuSite() {
  const ts = readFileSync('src/data/countries.ts', 'utf8');
  const vues = new Map();

  // sourcesVisa : { label: '…', url: 'https://…' }, éventuellement suivi de
  // `surveillee: false`.
  //
  // Toutes les sources citées ne sont pas surveillables. L'accueil de
  // l'ambassade de Chine, par exemple, est un fil d'actualité : son texte
  // change intégralement chaque jour, et il ne documente aucune règle de visa.
  // Le surveiller produisait une alerte quotidienne au motif « similarité
  // 0,0 % » — du bruit pur, et le bruit finit par faire ignorer le signal.
  // La retirer des sources citées serait pire : elle reste la référence
  // officielle pour le lecteur. On la cite donc, sans la surveiller, et la
  // raison est écrite à côté dans countries.ts.
  const bloc = /\{\s*label:\s*(?:"([^"]*)"|'([^']*)'),\s*url:\s*'([^']+)'\s*(,\s*surveillee:\s*(true|false)\s*)?\}/g;
  for (const m of ts.matchAll(bloc)) {
    if (m[5] === 'false') continue;
    const label = m[1] ?? m[2];
    const url = m[3];
    if (!vues.has(url)) vues.set(url, { url, label, origine: 'countries.ts' });
  }

  // Les grilles tarifaires des assureurs, qui changent plus souvent que les
  // visas. On lit la liste explicite plutôt que de racler les adresses : une
  // page d'accueil surveillée déclenche une alerte par jour pour rien.
  if (existsSync('src/data/assurances.ts')) {
    const as = readFileSync('src/data/assurances.ts', 'utf8');
    const liste = as.slice(as.indexOf('sourcesTarifaires'));
    for (const m of liste.matchAll(/\{\s*label:\s*'([^']+)',\s*url:\s*'([^']+)'\s*\}/g)) {
      if (!vues.has(m[2])) vues.set(m[2], { url: m[2], label: m[1], origine: 'assurances.ts' });
    }
  }
  return [...vues.values()];
}

/* ── Normalisation : ce qu'on compare vraiment ─────────────────── */

/**
 * Réduit une page à son texte signifiant. Sans cette étape, un compteur de
 * visites ou un horodatage suffirait à déclencher une alerte par jour, et la
 * sentinelle finirait ignorée — ce qui est pire que pas de sentinelle du tout.
 */
function normaliser(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .toLowerCase()
    // Dates, heures, identifiants de session : bruit pur.
    .replace(/\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/g, ' ')
    .replace(/\d{1,2}:\d{2}(:\d{2})?/g, ' ')
    .replace(/[a-f0-9]{16,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Les valeurs chiffrées de la page : durées, tarifs, plafonds.
 *
 * C'est le vrai signal. Un portail officiel réécrit ses accroches et fait
 * tourner un carrousel de destinations sans qu'aucune règle ne bouge ; en
 * revanche, un « 45 » qui devient « 30 » ou un tarif qui monte, c'est
 * exactement ce qu'on veut voir le lendemain matin.
 */
function chiffres(texte) {
  const out = new Set();
  for (const m of texte.matchAll(/\d[\d  .]*(?:,\d+)?/g)) {
    const v = m[0].replace(/[  .]/g, '').replace(',', '.');
    // Les années et les nombres à rallonge — numéros de téléphone, identifiants —
    // bougent pour des raisons qui n'ont rien à voir avec une règle.
    if (v.length > 9) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n === 0) continue;
    if (n >= 1900 && n <= 2100 && Number.isInteger(n)) continue;
    out.add(v);
  }
  return out;
}

/** Similarité par ensemble de mots : robuste au réagencement du gabarit. */
function similarite(a, b) {
  const A = new Set(a.split(' ').filter((w) => w.length > 2));
  const B = new Set(b.split(' ').filter((w) => w.length > 2));
  if (!A.size && !B.size) return 1;
  let commun = 0;
  for (const w of A) if (B.has(w)) commun++;
  return commun / (A.size + B.size - commun);
}

/** Les mots apparus et disparus : c'est ce qu'un humain veut lire en premier. */
function differences(avant, apres) {
  const A = new Set(avant.split(' ').filter((w) => w.length > 3));
  const B = new Set(apres.split(' ').filter((w) => w.length > 3));
  const ajoutes = [...B].filter((w) => !A.has(w));
  const retires = [...A].filter((w) => !B.has(w));
  // Les nombres d'abord : une durée de séjour ou un tarif, c'est ce qui bouge.
  const chiffresDabord = (l) => l.sort((x, y) => (/\d/.test(y) ? 1 : 0) - (/\d/.test(x) ? 1 : 0));
  return { ajoutes: chiffresDabord(ajoutes).slice(0, 18), retires: chiffresDabord(retires).slice(0, 18) };
}

/* ── Récupération ──────────────────────────────────────────────── */

async function recuperer(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'fr,en;q=0.8' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (!r.ok) return { erreur: `HTTP ${r.status}` };
    return { texte: normaliser(await r.text()) };
  } catch (e) {
    return { erreur: e.name === 'AbortError' ? 'délai dépassé' : String(e.cause?.code ?? e.message).slice(0, 40) };
  } finally {
    clearTimeout(t);
  }
}

async function enLots(items, n, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += n) {
    out.push(...(await Promise.all(items.slice(i, i + n).map(fn))));
  }
  return out;
}

/* ── Programme ─────────────────────────────────────────────────── */

const sources = await sourcesDuSite();
const base = existsSync(EMPREINTES) ? JSON.parse(readFileSync(EMPREINTES, 'utf8')) : { genereLe: null, pages: {} };

if (!JSON_OUT) console.log(`Sentinelle — ${sources.length} sources officielles surveillées\n`);

const resultats = await enLots(sources, PARALLELE, async (s) => {
  const r = await recuperer(s.url);
  if (r.erreur) return { ...s, etat: 'inaccessible', detail: r.erreur };

  const empreinte = createHash('sha256').update(r.texte).digest('hex').slice(0, 16);
  const ref = base.pages[s.url];

  if (!ref) return { ...s, etat: 'nouvelle', empreinte, texte: r.texte };
  if (ref.empreinte === empreinte) return { ...s, etat: 'inchangée', empreinte };

  const sim = similarite(ref.texte ?? '', r.texte);
  const avant = chiffres(ref.texte ?? '');
  const apres = chiffres(r.texte);
  const chiffresAjoutes = [...apres].filter((v) => !avant.has(v));
  const chiffresRetires = [...avant].filter((v) => !apres.has(v));
  const chiffresOntBouge = chiffresAjoutes.length > 0 || chiffresRetires.length > 0;

  // Deux motifs d'alerte, et deux seulement : une valeur chiffrée a changé,
  // ou la page a été réécrite en profondeur. Le reste — accroches, carrousels,
  // fils d'actualité — passe sans bruit.
  if (!chiffresOntBouge && sim >= SEUIL_REECRITURE) {
    return { ...s, etat: 'inchangée', empreinte, sim, texte: r.texte };
  }

  return {
    ...s, etat: 'modifiée', empreinte, sim, texte: r.texte,
    motif: chiffresOntBouge ? 'valeurs chiffrées' : 'réécriture',
    chiffres: { ajoutes: chiffresAjoutes.slice(0, 12), retires: chiffresRetires.slice(0, 12) },
    diff: differences(ref.texte ?? '', r.texte),
  };
});

const par = (e) => resultats.filter((r) => r.etat === e);
const modifiees = par('modifiée');
const inaccessibles = par('inaccessible');
const nouvelles = par('nouvelle');

if (INIT || nouvelles.length) {
  const pages = { ...base.pages };
  for (const r of resultats) {
    if (r.etat === 'inaccessible') continue;
    if (INIT || r.etat === 'nouvelle' || (INIT && r.etat === 'modifiée')) {
      pages[r.url] = { label: r.label, empreinte: r.empreinte, texte: r.texte, releveLe: new Date().toISOString().slice(0, 10) };
    } else if (!pages[r.url]) {
      pages[r.url] = { label: r.label, empreinte: r.empreinte, texte: r.texte, releveLe: new Date().toISOString().slice(0, 10) };
    }
  }
  writeFileSync(EMPREINTES, JSON.stringify({ genereLe: new Date().toISOString().slice(0, 10), pages }, null, 0));
}

if (JSON_OUT) {
  console.log(JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    surveillees: sources.length,
    modifiees: modifiees.map((m) => ({ url: m.url, label: m.label, motif: m.motif, similarite: +(m.sim ?? 0).toFixed(3), chiffres: m.chiffres })),
    inaccessibles: inaccessibles.map((m) => ({ url: m.url, detail: m.detail })),
  }, null, 2));
} else {
  if (modifiees.length) {
    console.log(`⚠  ${modifiees.length} source(s) ont changé depuis le dernier relevé :\n`);
    for (const m of modifiees) {
      console.log(`   ${m.label}`);
      console.log(`   ${m.url}`);
      console.log(`   motif : ${m.motif} — similarité du texte ${(m.sim * 100).toFixed(1)} %`);
      if (m.chiffres.ajoutes.length) console.log(`   valeurs apparues  : ${m.chiffres.ajoutes.join(', ')}`);
      if (m.chiffres.retires.length) console.log(`   valeurs disparues : ${m.chiffres.retires.join(', ')}`);
      if (m.motif === 'réécriture' && m.diff.ajoutes.length) console.log(`   mots apparus      : ${m.diff.ajoutes.slice(0, 10).join(', ')}`);
      console.log();
    }
    console.log('   Ces mots ne sont qu\'un indice. Ouvrez la page, lisez la règle,');
    console.log('   corrigez la fiche, ajoutez la correction au journal, remontez la date.\n');
  } else {
    console.log('✓ Aucune source officielle n\'a bougé.\n');
  }

  if (inaccessibles.length) {
    console.log(`   ${inaccessibles.length} source(s) injoignables ce jour — souvent un blocage anti-robot, pas un lien mort :`);
    for (const m of inaccessibles) console.log(`     ${m.detail.padEnd(22)} ${m.url}`);
    console.log();
  }
  if (nouvelles.length) console.log(`   ${nouvelles.length} nouvelle(s) source(s) enregistrée(s) comme référence.\n`);
}

process.exit(modifiees.length ? 1 : 0);
