#!/usr/bin/env node
/**
 * Ce que la machine a publié le mois dernier.
 *
 * Un relevé, pas une demande de travail. Il existe pour deux moments : celui
 * où l'on veut contrôler par sondage sans tout relire, et celui où quelque
 * chose cloche et où il faut savoir ce qui est parti.
 */

import { readFileSync, readdirSync } from 'node:fs';

const DOSSIER = 'src/content/blog';
const debut = new Date(); debut.setMonth(debut.getMonth() - 1); debut.setDate(1);
const fin = new Date(); fin.setDate(0);
const iso = (d) => d.toISOString().slice(0, 10);

const articles = readdirSync(DOSSIER)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const md = readFileSync(`${DOSSIER}/${f}`, 'utf8');
    const entete = md.slice(0, md.indexOf('\n---', 4));
    return {
      slug: f.replace(/\.md$/, ''),
      titre: entete.match(/^title:\s*["'](.+)["']\s*$/m)?.[1] ?? f,
      date: entete.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1] ?? '',
      auto: /^redactionAutomatique:\s*true/m.test(entete),
      sources: (entete.match(/^\s*- \{ label:/gm) ?? []).length,
      pays: (entete.match(/^pays:\s*\[(.*)\]/m)?.[1] ?? '').replace(/['"]/g, ''),
      mots: md.split(/\s+/).length,
    };
  })
  .filter((a) => a.date >= iso(debut) && a.date <= iso(fin))
  .sort((a, b) => a.date.localeCompare(b.date));

if (!articles.length) {
  console.log('Aucun article publié sur la période.');
  process.exit(0);
}

console.log(`Du ${iso(debut)} au ${iso(fin)} — ${articles.length} article(s).\n`);
console.log('| Date | Article | Pays | Sources | Mots | Écrit par |');
console.log('| --- | --- | --- | --- | --- | --- |');
for (const a of articles) {
  console.log(`| ${a.date} | [${a.titre}](https://asiaunseen.com/blog/${a.slug}) | ${a.pays} | ${a.sources} | ${a.mots} | ${a.auto ? 'machine' : 'humain'} |`);
}

const auto = articles.filter((a) => a.auto);
console.log(`\n${auto.length} sur ${articles.length} ont été rédigés automatiquement, sans relecture avant publication.`);
if (auto.length) {
  console.log('\n**Le contrôle par sondage est la seule vérification humaine de ce dispositif.**');
  console.log('Ouvrez-en un au hasard, suivez deux ou trois liens de sources, et vérifiez');
  console.log('que ce que dit l\'article correspond à ce que dit la source. Dix minutes.');
  console.log('\nSi quelque chose cloche : passez `active` à `false` dans `src/data/redaction.ts`.');
}
