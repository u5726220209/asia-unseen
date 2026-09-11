#!/usr/bin/env node
/**
 * Ce qui attend son tour.
 *
 * Les articles poussés avec une `pubDate` future n'existent nulle part sur le
 * site : ni page, ni fil RSS, ni plan du site. Ce script est le seul endroit
 * d'où on les voit — pour savoir ce qui sortira, et quand.
 */

import { readdirSync, readFileSync } from 'node:fs';

// Les articles anglais comptent comme les autres : un calendrier de parution
// qui en ignorerait la moitié ferait croire la file vide un jour où elle ne
// l'est pas.
const DOSSIERS = ['src/content/blog', 'src/content/blog-en', 'src/content/guides'];
// Un jour de calendrier, pas un instant : voir la note dans src/lib/articles.ts.
const maintenant = new Date();
const aujourdhui = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`;

const attente = [];
for (const dossier of DOSSIERS) {
  for (const f of readdirSync(dossier).filter((f) => f.endsWith('.md'))) {
    const md = readFileSync(`${dossier}/${f}`, 'utf8');
    const entete = md.slice(0, md.indexOf('\n---', 4));
    const date = entete.match(/^pubDate:\s*['"]?(\d{4}-\d{2}-\d{2})/m)?.[1];
    const titre = entete.match(/^title:\s*['"]?(.+?)['"]?\s*$/m)?.[1] ?? f;
    const brouillon = /^draft:\s*true/m.test(entete);
    if (!date || brouillon) continue;
    if (date > aujourdhui) {
      const jours = Math.round((new Date(date) - new Date(aujourdhui)) / 86_400_000);
      attente.push({ date, titre, fichier: `${dossier}/${f}`, jours });
    }
  }
}
attente.sort((a, b) => a.date.localeCompare(b.date));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ enAttente: attente.length, articles: attente }, null, 2));
} else if (!attente.length) {
  console.log('Aucun article programmé. Tout ce qui est écrit est en ligne.');
} else {
  console.log(`${attente.length} article(s) programmé(s) :\n`);
  for (const a of attente) {
    const quand = a.jours === 1 ? 'demain' : `dans ${a.jours} jours`;
    console.log(`   ${a.date}  (${quand})`);
    console.log(`   ${a.titre}`);
    console.log(`   ${a.fichier}\n`);
  }
  console.log('   La mise en ligne quotidienne les fera paraître d\'elle-même.');
}
