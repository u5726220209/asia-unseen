#!/usr/bin/env node
/**
 * Les liens qui sortent du site.
 *
 * `verifier-liens.mjs` ne regarde que l'intérieur : il attrape une page qui
 * renvoie vers une page absente. Personne ne regardait les quatre-vingt-dix-neuf
 * adresses qui partent ailleurs — et ce sont précisément celles qui portent la
 * promesse du site.
 *
 * Une fiche pays affirme « voici la règle, et voici la source officielle ». Si
 * ce lien tombe en 404, la phrase reste, la preuve disparaît, et le site
 * ressemble exactement à ce qu'il reproche aux autres : une affirmation sans
 * source vérifiable. C'est le pire endroit possible pour un lien mort.
 *
 * L'autre moitié est financière. Un lien partenaire cassé ne rapporte rien et
 * ne le dit pas : la page continue de s'afficher, le lecteur clique, et la
 * commission n'existe pas.
 *
 * LE PIÈGE, DÉJÀ RENCONTRÉ DEUX FOIS ICI
 * Un portail officiel qui répond 403 à un robot n'est pas un lien mort : il
 * s'ouvre parfaitement dans un navigateur. La sentinelle de trafic lisait
 * autrefois un 403 comme « zéro impression », et la veille lisait une page
 * vide comme « inchangée ». Confondre « je n'ai pas pu lire » avec « c'est
 * cassé » produit une alerte quotidienne pour rien — et une alerte qu'on
 * ignore ne sert plus à rien du tout.
 *
 * D'où trois verdicts et non deux : mort, muet, vivant. Seul le premier
 * demande une correction.
 *
 * IL ALERTE, IL NE BLOQUE PAS
 * Qu'un site tiers tombe n'est pas une raison d'empêcher notre publication.
 * Ce contrôle tourne avec la veille de nuit, comme les autres constats qui
 * dépendent de l'extérieur.
 *
 *   node scripts/liens-externes.mjs
 *   node scripts/liens-externes.mjs --json
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { PREFIXES } from './lib/collections.mjs';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

const JSON_OUT = process.argv.includes('--json');

if (!existsSync('dist')) {
  console.error("dist/ est absent : construisez le site d'abord.\n");
  process.exit(2);
}

/* ── Recensement ────────────────────────────────────────────────── */

const pages = [];
(function parcourir(dossier) {
  for (const e of readdirSync(dossier, { withFileTypes: true })) {
    const chemin = `${dossier}/${e.name}`;
    if (e.isDirectory()) parcourir(chemin);
    else if (e.name === 'index.html') pages.push(chemin);
  }
})('dist');

/**
 * Les adresses citées comme sources, qui pèsent plus lourd que les autres.
 *
 * Elles vivent à trois endroits, et la première version de ce contrôle n'en
 * lisait que deux : elle a classé une source de France Diplomatie morte comme
 * un lien ordinaire, alors qu'elle appuyait l'en-tête d'un article. Les
 * sources déclarées dans les articles et les guides comptent autant que celles
 * des fiches pays — c'est le même engagement pris devant le lecteur.
 */
const sourcesOfficielles = new Set([
  ...[...readFileSync('src/data/countries.ts', 'utf8').matchAll(/url: '(https?:[^']+)'/g)].map((m) => m[1]),
  ...[...readFileSync('src/data/chiffres-cites.ts', 'utf8').matchAll(/^const [A-Z_0-9]+ = '(https?:[^']+)';$/gm)].map((m) => m[1]),
  ...Object.keys(PREFIXES).flatMap((dossier) =>
    !existsSync(dossier) ? [] :
    readdirSync(dossier)
      .filter((f) => f.endsWith('.md'))
      .flatMap((f) => {
        const entete = readFileSync(`${dossier}/${f}`, 'utf8').split('\n---')[0];
        return [...entete.matchAll(/url:\s*"(https?:[^"]+)"|url:\s*'(https?:[^']+)'/g)].map((m) => m[1] ?? m[2]);
      }),
  ),
]);

const liens = new Map(); // url -> Set de pages
for (const f of pages) {
  const html = readFileSync(f, 'utf8');
  const page = f.replace(/^dist/, '').replace(/\/index\.html$/, '') || '/';
  for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
    const url = m[1];
    if (url.includes('asiaunseen.com')) continue;
    if (!liens.has(url)) liens.set(url, new Set());
    liens.get(url).add(page);
  }
}

/**
 * Les textes qui attendent leur date de parution.
 *
 * Leurs adresses extérieures n'étaient testées qu'au matin de leur
 * publication. Vingt-neuf textes anglais sont programmés sur onze semaines et
 * citent des portails que le site ne connaissait pas — GOV.UK, l'opérateur
 * ferroviaire de Hong Kong, la régie d'Angkor, le centre du patrimoine de Hoi
 * An. Une adresse morte y aurait dormi jusqu'au jour où elle devient publique,
 * c'est-à-dire jusqu'au seul jour où personne ne la relit.
 *
 * On les recense sous le nom de leur fichier : la page n'existe pas encore, et
 * prétendre le contraire rendrait le rapport faux.
 */
{
  const aujourdhui = new Date().toISOString().slice(0, 10);
  for (const dossier of Object.keys(PREFIXES)) {
    if (!existsSync(dossier)) continue;
    for (const f of readdirSync(dossier).filter((x) => x.endsWith('.md'))) {
      const md = readFileSync(`${dossier}/${f}`, 'utf8');
      const date = md.slice(0, 1400).match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
      if (!date || date <= aujourdhui) continue;
      const ou = `${dossier}/${f} (paraît le ${date})`;
      const adresses = [
        ...[...md.matchAll(/url:\s*"(https?:[^"]+)"|url:\s*'(https?:[^']+)'/g)].map((m) => m[1] ?? m[2]),
        ...[...md.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]),
      ];
      for (const url of adresses) {
        if (url.includes('asiaunseen.com')) continue;
        if (!liens.has(url)) liens.set(url, new Set());
        liens.get(url).add(ou);
      }
    }
  }
}

/* ── Interrogation ──────────────────────────────────────────────── */

/**
 * Deux tentatives, et la seconde compte.
 *
 * Beaucoup de serveurs refusent HEAD tout en servant parfaitement GET : ne
 * faire que HEAD condamnerait des liens parfaitement vivants. On commence par
 * HEAD parce qu'il est léger, et on ne conclut jamais à la mort sans avoir
 * essayé GET.
 */
async function interroger(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20_000);
      const r = await fetch(url, {
        method,
        headers: { 'User-Agent': UA, 'Accept-Language': 'fr,en;q=0.8' },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (r.ok) return { etat: 'vivant', code: r.status, finale: r.url };
      // 404 et 410 sont des verdicts du serveur sur l'adresse elle-même.
      // Tout le reste — 403, 429, 5xx — parle de nous ou de son humeur.
      if (r.status === 404 || r.status === 410) {
        if (method === 'GET') return { etat: 'mort', code: r.status };
        continue;
      }
      if (method === 'GET') return { etat: 'muet', code: `HTTP ${r.status}` };
    } catch (e) {
      const code = String(e.cause?.code ?? e.name ?? e.message).slice(0, 32);
      // Un domaine qui ne résout plus n'existe plus : c'est une mort, pas une
      // humeur. Le reste — TLS, délai dépassé, connexion refusée — peut être
      // passager ou tenir au blocage des robots.
      if (code === 'ENOTFOUND') return { etat: 'mort', code: 'domaine introuvable' };
      if (method === 'GET') return { etat: 'muet', code };
    }
  }
  return { etat: 'muet', code: 'sans réponse' };
}

/** Un domaine à la fois en série, plusieurs domaines en parallèle. */
async function parDomaine(urls, parallele = 6) {
  const groupes = new Map();
  for (const u of urls) {
    const d = new URL(u).hostname;
    if (!groupes.has(d)) groupes.set(d, []);
    groupes.get(d).push(u);
  }
  const files = [...groupes.values()];
  const resultats = new Map();
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(parallele, files.length) }, async () => {
      while (i < files.length) {
        for (const url of files[i++]) resultats.set(url, await interroger(url));
      }
    }),
  );
  return resultats;
}

const resultats = await parDomaine([...liens.keys()]);

const classe = (etat) =>
  [...resultats.entries()]
    .filter(([, r]) => r.etat === etat)
    .map(([url, r]) => ({
      url,
      ...r,
      source: sourcesOfficielles.has(url),
      pages: [...liens.get(url)],
    }));

const morts = classe('mort').sort((a, b) => Number(b.source) - Number(a.source));
const muets = classe('muet');
const vivants = classe('vivant').length;

/* ── Rapport ────────────────────────────────────────────────────── */

if (JSON_OUT) {
  console.log(JSON.stringify({
    date: new Date().toISOString().slice(0, 10),
    total: liens.size,
    vivants,
    morts: morts.map(({ url, code, source, pages }) => ({ url, code, source, pages })),
    muets: muets.map(({ url, code }) => ({ url, code })),
  }, null, 2));
} else {
  console.log(`Liens sortants — ${liens.size} adresses sur ${new Set([...liens.keys()].map((u) => new URL(u).hostname)).size} domaines\n`);

  if (morts.length) {
    console.log(`⚠  ${morts.length} lien(s) mort(s) :\n`);
    for (const m of morts) {
      console.log(`   ${m.source ? '⚑ SOURCE OFFICIELLE — ' : ''}${m.code}`);
      console.log(`   ${m.url}`);
      console.log(`   cité sur : ${m.pages.slice(0, 4).join(', ')}${m.pages.length > 4 ? ` (+${m.pages.length - 4})` : ''}\n`);
    }
    if (morts.some((m) => m.source)) {
      console.log('   Une source morte est plus grave qu\'un lien mort ordinaire : la');
      console.log('   phrase qu\'elle appuie reste affichée, et la preuve disparaît.');
      console.log('   Le site ressemble alors à ce qu\'il reproche aux autres.\n');
    }
  } else {
    console.log('✓ Aucun lien mort.\n');
  }

  if (muets.length) {
    console.log(`   ${muets.length} adresse(s) n'ont pas répondu à un robot — ce n'est pas une mort :`);
    for (const m of muets) console.log(`     ${String(m.code).padEnd(22)} ${m.url}`);
    console.log('   Ouvrez-les dans un navigateur avant de conclure quoi que ce soit.\n');
  }

  console.log(`   ${vivants} lien(s) répondent normalement.\n`);
}

// 2, jamais 1 : un site tiers qui tombe n'est pas une raison d'empêcher notre
// publication. Ce contrôle alerte, comme la veille, et laisse passer.
process.exit(morts.length ? 2 : 0);
