#!/usr/bin/env node
/**
 * La santé des liens affiliés.
 *
 * Ce sont les seuls liens du site qui rapportent quelque chose, et ce sont
 * aussi les plus fragiles : un partenaire change ses URL, un programme est
 * clôturé, un identifiant de tracking est retiré du .env par mégarde. Dans les
 * trois cas le lien continue de fonctionner pour le visiteur — il arrive bien
 * chez le partenaire — mais la commission est perdue. Rien ne le signale.
 *
 * D'où deux contrôles, sur le site tel qu'il est construit :
 *
 *   1. le lien répond-il ? Une 404 chez le partenaire fait fuir le visiteur ;
 *   2. porte-t-il encore son identifiant ? Un lien sans tracking est un
 *      visiteur envoyé gratuitement à la concurrence.
 *
 * Le second est le plus important, et c'est le seul que personne ne remarque.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/**
 * Le marqueur de tracking attendu, par domaine partenaire, et la variable
 * d'environnement qui le porte.
 *
 * Cette dernière colonne est ce qui rend le contrôle utile. Un lien sans
 * identifiant n'est un défaut que si le programme est ouvert : tant qu'il ne
 * l'est pas, la variable est vide et le lien pointe volontairement vers le
 * partenaire sans tracking — le site ne casse jamais pour attendre une
 * inscription. Crier dans ce cas rendrait le contrôle rouge en permanence, et
 * un contrôle toujours rouge est un contrôle qu'on apprend à ignorer.
 */
const TRACKING = [
  { hote: 'booking.com',     parametre: 'aid',        variable: 'PUBLIC_AFF_BOOKING' },
  { hote: 'agoda.com',       parametre: 'cid',        variable: 'PUBLIC_AFF_AGODA' },
  { hote: '12go.asia',       parametre: 'z',          variable: 'PUBLIC_AFF_12GO' },
  { hote: 'getyourguide',    parametre: 'partner_id', variable: 'PUBLIC_AFF_GETYOURGUIDE' },
  { hote: 'airalo.com',      parametre: 'ref',        variable: 'PUBLIC_AFF_AIRALO' },
  { hote: 'holafly.com',     parametre: 'ref',        variable: 'PUBLIC_AFF_HOLAFLY' },
  { hote: 'chapkadirect.fr', parametre: 'ag',         variable: 'PUBLIC_AFF_CHAPKA' },
  // Redirections CJ Affiliate : l'identifiant est dans le chemin, pas en paramètre.
  { hote: 'anrdoezrs.net',   parametre: null, variable: null },
  { hote: 'jdoqocy.com',     parametre: null, variable: null },
  { hote: 'tkqlhce.com',     parametre: null, variable: null },
  { hote: 'dpbolvw.net',     parametre: null, variable: null },
];

/**
 * Quels programmes sont réellement ouverts. En local la réponse est dans .env ;
 * dans l'intégration continue, elle vient des secrets du dépôt.
 */
const configuration = { ...process.env };
if (existsSync('.env')) {
  for (const l of readFileSync('.env', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)\s*$/);
    if (m && !configuration[m[1]]) configuration[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const programmeOuvert = (v) => Boolean(v && configuration[v]?.trim());

if (!existsSync('dist')) {
  console.error('dist/ est absent : construisez le site d\'abord (npm run build).');
  process.exit(1);
}

/* ── Recenser les liens sortants du site construit ───────────────── */

const html = execFileSync('bash', ['-c', 'cat $(find dist -name "*.html")'], {
  encoding: 'utf8', maxBuffer: 200 * 1024 * 1024,
});

const liens = new Map(); // url → nombre d'occurrences
for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
  const url = m[1].replace(/&amp;/g, '&');
  const partenaire = TRACKING.find((t) => url.includes(t.hote));
  if (!partenaire) continue;
  liens.set(url, (liens.get(url) ?? 0) + 1);
}

if (!liens.size) {
  console.log('Aucun lien affilié trouvé dans le site construit.');
  console.log('C\'est normal tant que les identifiants ne sont pas dans le .env :');
  console.log('sans identifiant, les liens pointent vers le partenaire sans tracking.\n');
}

/* ── 1. L'identifiant est-il bien là ? Hors ligne, donc bloquant. ── */

const sansTracking = [];
const enAttente = new Map();
for (const [url] of liens) {
  const t = TRACKING.find((x) => url.includes(x.hote));
  if (!t?.parametre) continue; // redirection réseau : rien à vérifier ici
  if (!programmeOuvert(t.variable)) {
    enAttente.set(t.variable, (enAttente.get(t.variable) ?? 0) + 1);
    continue;
  }
  const valeur = new URL(url).searchParams.get(t.parametre);
  // Le programme est ouvert mais ce lien-ci n'en profite pas : il a été écrit
  // à la main au lieu de passer par buildUrl(). C'est de l'argent perdu.
  if (!valeur) sansTracking.push({ url, manque: t.parametre, variable: t.variable });
}

/* ── 2. Le lien répond-il ? En ligne, donc informatif. ───────────── */

const morts = [];
if (!process.argv.includes('--hors-ligne')) {
  for (const [url] of liens) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25_000);
      // Un GET, pas un HEAD : plusieurs de ces plateformes répondent 405 au HEAD.
      const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctrl.signal });
      clearTimeout(t);
      // 403 et 429 sont des refus de robot, pas des liens morts.
      if (r.status >= 400 && ![403, 429].includes(r.status)) morts.push({ url, statut: r.status });
    } catch (e) {
      morts.push({ url, statut: String(e.cause?.code ?? 'injoignable') });
    }
  }
}

/* ── Rapport ────────────────────────────────────────────────────── */

const total = [...liens.values()].reduce((a, b) => a + b, 0);
console.log(`Liens affiliés — ${liens.size} destinations distinctes, ${total} occurrences\n`);

if (sansTracking.length) {
  console.log(`⛔ ${sansTracking.length} lien(s) perdent leur commission :\n`);
  for (const l of sansTracking) {
    console.log(`   ${l.variable} est renseigné, mais ce lien n'a pas de « ${l.manque} »`);
    console.log(`   ${l.url}\n`);
  }
  console.log('   Le programme est ouvert : ces liens devraient rapporter et ne rapportent rien.');
  console.log('   Ils ont sans doute été écrits à la main au lieu de passer par buildUrl().\n');
} else if (liens.size) {
  console.log('✓ Tous les liens des programmes ouverts portent leur identifiant.\n');
}

if (enAttente.size) {
  console.log('   Programmes pas encore ouverts — les liens pointent volontairement');
  console.log('   vers le partenaire, sans tracking :');
  for (const [v, n] of [...enAttente].sort()) console.log(`     ${v.padEnd(28)} ${n} lien(s)`);
  console.log();
}

if (morts.length) {
  console.log(`⚠  ${morts.length} lien(s) ne répondent pas :\n`);
  for (const l of morts) console.log(`   ${l.statut}  ${l.url}`);
  console.log('\n   Ouvrez-les à la main : un partenaire a peut-être changé ses URL.\n');
} else if (liens.size && !process.argv.includes('--hors-ligne')) {
  console.log('✓ Tous les liens répondent.\n');
}

// Un lien sans tracking est notre erreur, réparable et coûteuse : il bloque.
// Un lien qui ne répond pas peut être un blocage anti-robot : il alerte.
process.exit(sansTracking.length ? 1 : morts.length ? 2 : 0);
