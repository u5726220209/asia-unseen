/**
 * Contrôle des liens externes du site compilé.
 *
 *   npm run build && npm run sources
 *
 * Le site s'appuie sur des sources officielles et l'affirme sur chaque fiche.
 * Un lien mort casse cette promesse plus sûrement qu'une information périmée :
 * le lecteur ne peut même plus vérifier.
 *
 * À lancer avec l'audit mensuel de fraîcheur.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = process.env.PUBLIC_SITE_URL ?? 'https://asiaunseen.com';
const TIMEOUT = 20_000;

const liens = new Map(); // url → pages qui la citent
(function marche(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) marche(p);
    else if (e.name.endsWith('.html')) {
      const html = readFileSync(p, 'utf8');
      for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
        const url = m[1].split('#')[0];
        if (url.includes('asiaunseen.com') || url.includes(new URL(SITE).hostname)) continue;
        if (!liens.has(url)) liens.set(url, new Set());
        liens.get(url).add(p.replace(/^dist/, '').replace(/index\.html$/, '') || '/');
      }
    }
  }
})('dist');

console.log(`\n${liens.size} liens externes à vérifier…\n`);

/** Certains sites refusent HEAD, ou tout client qui n'a pas l'air d'un navigateur. */
async function teste(url) {
  const entetes = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  };
  for (const method of ['HEAD', 'GET']) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), TIMEOUT);
      const r = await fetch(url, { method, redirect: 'follow', headers: entetes, signal: ctrl.signal });
      clearTimeout(t);
      if (r.status < 400) return { ok: true, code: r.status };
      if (method === 'GET') return { ok: false, code: r.status };
    } catch (e) {
      if (method === 'GET') return { ok: false, code: e.cause?.code ?? e.name ?? 'ERREUR' };
    }
  }
  return { ok: false, code: '?' };
}

const urls = [...liens.keys()].sort();
const resultats = [];
const LOT = 6;
for (let i = 0; i < urls.length; i += LOT) {
  const lot = urls.slice(i, i + LOT);
  const r = await Promise.all(lot.map(teste));
  lot.forEach((u, j) => resultats.push({ url: u, ...r[j] }));
  process.stdout.write('.');
}
console.log('\n');

const ko = resultats.filter((r) => !r.ok);
console.log(`✓ ${resultats.length - ko.length} liens répondent.`);

if (ko.length) {
  console.log(`\n⚠ ${ko.length} lien(s) sans réponse valide :\n`);
  for (const r of ko) {
    console.log(`   ${String(r.code).padEnd(22)} ${r.url}`);
    for (const p of liens.get(r.url)) console.log(`   ${' '.repeat(22)}   cité sur ${p}`);
  }
  console.log(
    "\n   Un code 403 signifie souvent un blocage des robots, pas un lien mort :\n" +
    '   ouvrez l\'adresse dans un navigateur avant de la retirer.\n',
  );
  process.exit(0); // avertissement, pas échec de compilation
}
console.log('');
