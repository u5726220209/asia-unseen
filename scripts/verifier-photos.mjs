/**
 * Contrôle du registre photographique.
 *
 *   npm run photos
 *
 * Vérifie que chaque photo déclarée existe, que chaque fichier déposé est
 * déclaré, que les textes alternatifs tiennent la route, et que les pages
 * visées existent réellement dans le site compilé.
 *
 * Une photo mal déclarée ne casse pas le site — l'emplacement retombe sur une
 * illustration — mais elle ne s'affiche pas, et ça se remarque tard.
 */
import { readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DOSSIER = 'src/photos';
const EXT = /\.(jpe?g|png|webp|avif)$/i;

/* — Lecture du registre : on parse le TS sans le compiler, c'est suffisant — */
const src = readFileSync('src/data/photos.ts', 'utf8');
const corps = src.slice(src.indexOf('export const photos'), src.indexOf('/** Photo déclarée pour une page'));

const declarees = [...corps.matchAll(/\{\s*fichier:\s*'([^']+)'([\s\S]*?)\n  \}/g)]
  .filter((m) => !/^\s*\/\//m.test(m[0].split('\n')[0]))
  .map((m) => {
    const bloc = m[2];
    const champ = (n) => (bloc.match(new RegExp(n + ":\\s*[\"'`]([^\"'`]*)")) || [])[1];
    return {
      fichier: m[1],
      alt: champ('alt') ?? '',
      pages: [...(bloc.match(/pages:\s*\[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([^']+)'/g)].map((x) => x[1]),
      position: champ('position') ?? '',
      credit: /credit:\s*\{/.test(bloc),
    };
  });

/* — Fichiers réellement présents — */
const presents = [];
if (existsSync(DOSSIER)) {
  (function marche(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) marche(p);
      else if (EXT.test(e.name)) presents.push(relative(DOSSIER, p));
    }
  })(DOSSIER);
}

/* — Pages du site compilé, si disponible — */
const pagesConnues = new Set();
if (existsSync('dist')) {
  (function marche(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) marche(p);
      else if (e.name === 'index.html') {
        const u = '/' + relative('dist', p).replace(/index\.html$/, '').replace(/\/$/, '');
        pagesConnues.add(u === '/' ? '/' : u);
      }
    }
  })('dist');
}

const erreurs = [];
const avertissements = [];

for (const d of declarees) {
  if (!presents.includes(d.fichier)) {
    erreurs.push(`Fichier introuvable : src/photos/${d.fichier}`);
    continue;
  }
  const taille = statSync(join(DOSSIER, d.fichier)).size / 1024 / 1024;
  if (taille > 8) avertissements.push(`${d.fichier} pèse ${taille.toFixed(1)} Mo — réduisez la source sous 8 Mo`);

  if (!d.alt.trim()) erreurs.push(`Texte alternatif vide : ${d.fichier}`);
  else {
    if (d.alt.length > 125) avertissements.push(`Alt de ${d.alt.length} caractères sur ${d.fichier} — visez 125 maximum`);
    if (/^(image|photo|photographie|illustration)\b/i.test(d.alt))
      avertissements.push(`Alt de ${d.fichier} commence par « ${d.alt.split(' ')[0]} » — décrivez la scène directement`);
    if (/\.$/.test(d.alt.trim()))
      avertissements.push(`Alt de ${d.fichier} se termine par un point — inutile, les lecteurs d'écran marquent déjà la pause`);
  }

  if (!['hero', 'bande'].includes(d.position)) erreurs.push(`Position invalide sur ${d.fichier} : « ${d.position} »`);
  if (!d.pages.length) erreurs.push(`Aucune page déclarée pour ${d.fichier}`);
  if (!d.credit) avertissements.push(`Pas de crédit sur ${d.fichier} — obligatoire pour une image tierce`);

  for (const page of d.pages) {
    if (pagesConnues.size && !pagesConnues.has(page.replace(/\/$/, '') || '/'))
      erreurs.push(`Page inexistante pour ${d.fichier} : « ${page} »`);
  }
}

const orphelins = presents.filter((f) => !declarees.some((d) => d.fichier === f));
for (const o of orphelins)
  avertissements.push(`Déposé mais non déclaré, donc invisible : src/photos/${o}`);

/* — Rapport — */
console.log(`\nPhotos déposées : ${presents.length}   ·   déclarées : ${declarees.length}   ·   pages couvertes : ${new Set(declarees.flatMap((d) => d.pages)).size}`);

if (avertissements.length) {
  console.log(`\n⚠  ${avertissements.length} avertissement(s) :`);
  avertissements.forEach((a) => console.log(`   · ${a}`));
}
if (erreurs.length) {
  console.log(`\n✗  ${erreurs.length} erreur(s) :`);
  erreurs.forEach((e) => console.log(`   · ${e}`));
  console.log('');
  process.exit(1);
}
console.log(erreurs.length || avertissements.length ? '' : '\n✓ Registre cohérent.\n');
