#!/usr/bin/env node
/**
 * Recherche de photographies sur Wikimedia Commons.
 *
 *   npm run commons -- "Hanoi Old Quarter street"          → propose 8 candidates
 *   npm run commons -- "Hanoi Old Quarter" --prendre 3 \
 *       --vers vietnam/hanoi-vieux-quartier.jpg --page /vietnam
 *
 * Commons est la seule source qui livre, en un seul appel, les trois choses
 * dont ce site a besoin : la licence exacte, l'auteur, et un drapeau signalant
 * qu'une personne identifiable figure sur l'image. Cette dernière information
 * n'existe nulle part ailleurs, et c'est elle qui rend l'automatisation
 * défendable : en droit français, publier à des fins commerciales l'image
 * d'une personne reconnaissable exige son autorisation écrite, qu'aucune
 * licence de banque d'images ne transmet.
 *
 * Ce script n'accepte donc que ce qui est publiable sans discussion, et rejette
 * le reste en disant pourquoi.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { traiter } from './lib/traitement.mjs';

const UA = 'AsiaUnseen/1.0 (https://asiaunseen.com; contact@racinesvietnam.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

/**
 * Licences acceptées. Le domaine public et CC BY conviennent : on cite l'auteur,
 * ce que le site fait déjà pour ses sources.
 *
 * CC BY-SA est volontairement exclu. Sa clause de partage à l'identique se
 * propage aux œuvres dérivées, et notre traitement d'homogénéité en est une.
 * On ne va pas placer le site sous licence libre pour une photographie.
 */
const LICENCES_OK = [
  /^cc0/i, /^public domain/i, /^cc by 4\.0/i, /^cc by 3\.0/i, /^cc by 2\.5/i,
  /^cc by 2\.0/i, /^cc by 1\.0/i, /^attribution$/i,
];

const RESOLUTION_MINIMALE = 1600; // en largeur, après quoi le recadrage devient serré

/**
 * Les bandeaux du site sont larges — 2:1 pour un en-tête, 3:1 pour une
 * respiration. Recadrer un portrait à ce rapport jette les trois quarts du
 * cadre, et ce qui reste n'est presque jamais ce que le photographe visait.
 * On exige donc une image déjà horizontale.
 */
const RAPPORT_MINIMAL = 1.2;

const args = process.argv.slice(2);
const requete = args.filter((a) => !a.startsWith('--'))[0];
const lire = (nom) => { const i = args.indexOf(`--${nom}`); return i >= 0 ? args[i + 1] : null; };

if (!requete) {
  console.error('Usage : npm run commons -- "Hanoi Old Quarter street"');
  console.error('        npm run commons -- "…" --prendre 3 --vers vietnam/hanoi.jpg --page /vietnam');
  process.exit(1);
}

const sansBalises = (s) => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/** Écart moyen entre les canaux : proche de zéro sur une image monochrome. */
async function saturationMoyenne(entree) {
  const { default: sharp } = await import('sharp');
  const { channels } = await sharp(entree, { failOn: 'none' }).stats();
  if (channels.length < 3) return 0;
  const [r, g, b] = channels.map((c) => c.mean);
  return Math.round((Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b)) / 3 * 10) / 10;
}

/* ── Interroger Commons ─────────────────────────────────────────── */

const url = new URL(API);
url.search = new URLSearchParams({
  action: 'query', format: 'json', origin: '*',
  generator: 'search', gsrnamespace: '6', gsrlimit: '30',
  gsrsearch: `${requete} filetype:bitmap`,
  prop: 'imageinfo', iiprop: 'url|size|extmetadata|user',
}).toString();

const reponse = await fetch(url, { headers: { 'User-Agent': UA } });
const data = await reponse.json();
const pages = Object.values(data?.query?.pages ?? {});

if (!pages.length) {
  console.log(`Aucun résultat pour « ${requete} ».`);
  console.log('Essayez le nom du lieu en anglais, ou un nom de quartier plutôt qu\'une ville.');
  process.exit(0);
}

/* ── Trier le publiable de l'impubliable ────────────────────────── */

const candidats = [];
const ecartes = [];

for (const p of pages) {
  const info = p.imageinfo?.[0];
  if (!info) continue;
  const meta = info.extmetadata ?? {};
  const val = (k) => sansBalises(meta[k]?.value);

  const licence = val('LicenseShortName') || '—';
  const restrictions = val('Restrictions');
  const fiche = {
    titre: p.title.replace(/^File:/, ''),
    largeur: info.width, hauteur: info.height,
    url: info.url,
    page: info.descriptionurl,
    auteur: val('Artist') || info.user || 'auteur non renseigné',
    licence,
    licenceUrl: val('LicenseUrl'),
    description: val('ImageDescription').slice(0, 120),
  };

  // Une personne identifiable : rejet sans appel, quelle que soit la licence.
  if (/personality/i.test(restrictions)) { ecartes.push({ ...fiche, motif: 'personne identifiable' }); continue; }
  if (/trademark/i.test(restrictions))   { ecartes.push({ ...fiche, motif: 'marque déposée visible' }); continue; }
  if (!LICENCES_OK.some((r) => r.test(licence))) {
    ecartes.push({ ...fiche, motif: `licence « ${licence} » — non retenue` });
    continue;
  }
  if (info.width < RESOLUTION_MINIMALE) {
    ecartes.push({ ...fiche, motif: `${info.width} px de large, trop peu` });
    continue;
  }
  if (info.width / info.height < RAPPORT_MINIMAL) {
    ecartes.push({ ...fiche, motif: 'cadrage vertical' });
    continue;
  }
  candidats.push(fiche);
}

/* ── Prendre une photo, ou seulement proposer ───────────────────── */

const prendre = lire('prendre');
const vers = lire('vers');

if (prendre && vers) {
  const choix = candidats[Number(prendre) - 1];
  if (!choix) { console.error(`Il n'y a pas de candidat n° ${prendre}.`); process.exit(1); }

  const bin = await fetch(choix.url, { headers: { 'User-Agent': UA } });
  const original = Buffer.from(await bin.arrayBuffer());

  // Le noir et blanc ne se lit pas dans les métadonnées : il faut les pixels.
  // Une seule image monochrome au milieu de huit photos couleur ruine
  // exactement l'homogénéité qu'on cherche à construire.
  const sat = await saturationMoyenne(original);
  if (sat < 6 && !args.includes('--accepter-monochrome')) {
    console.error(`Cette image est en noir et blanc (saturation ${sat}).`);
    console.error('Elle jurerait au milieu des autres. Choisissez-en une autre,');
    console.error('ou forcez avec --accepter-monochrome si c\'est voulu.');
    process.exit(1);
  }

  const { buffer, largeur, hauteur } = await traiter(original, lire('variante') ?? 'hero');

  const chemin = `src/photos/${vers}`;
  mkdirSync(dirname(chemin), { recursive: true });
  if (existsSync(chemin) && !args.includes('--ecraser')) {
    console.error(`${chemin} existe déjà. Ajoutez --ecraser pour le remplacer.`);
    process.exit(1);
  }
  writeFileSync(chemin, buffer);

  console.log(`✓ ${chemin} — ${largeur}×${hauteur}, ${Math.round(buffer.length / 1024)} Ko\n`);
  console.log('Déclaration à coller dans src/data/photos.ts :\n');
  console.log(`  {
    fichier: '${vers}',
    alt: "DÉCRIVEZ CE QUE L'ON VOIT — sans point final, 125 caractères max",
    credit: {
      auteur: ${JSON.stringify(choix.auteur)},
      source: 'Wikimedia Commons',
      url: '${choix.page}',
    },
    licence: { nom: '${choix.licence}', url: '${choix.licenceUrl}' },
    origine: '${choix.page}',
    releveLe: '${new Date().toISOString().slice(0, 10)}',
    pages: ['${lire('page') ?? '/à-préciser'}'],
    position: '${lire('variante') ?? 'hero'}',
  },`);
  console.log('\nAVANT DE DÉCLARER CETTE PHOTO, OUVREZ-LA.');
  console.log('');
  console.log('Le drapeau « personne identifiable » de Commons est saisi par les');
  console.log('contributeurs, pas calculé : il est donc incomplet. Ce script en a');
  console.log('déjà laissé passer une. Si un visage est reconnaissable, écartez');
  console.log('l\'image — en droit français, son usage commercial exigerait une');
  console.log('autorisation écrite qu\'aucune licence ne transmet.');
  console.log('');
  console.log('Le texte alternatif reste lui aussi à écrire à la main : décrire');
  console.log('une image est un travail de rédaction, pas de recopie de métadonnées.');
  process.exit(0);
}

/* ── Rapport ────────────────────────────────────────────────────── */

console.log(`« ${requete} » — ${candidats.length} publiables sur ${pages.length} trouvées\n`);

candidats.slice(0, 8).forEach((c, i) => {
  console.log(`${String(i + 1).padStart(2)}. ${c.titre.slice(0, 70)}`);
  console.log(`    ${c.largeur}×${c.hauteur} · ${c.licence} · ${c.auteur.slice(0, 45)}`);
  if (c.description) console.log(`    ${c.description}`);
  console.log(`    ${c.page}\n`);
});

if (ecartes.length) {
  const motifs = ecartes.reduce((a, e) => ({ ...a, [e.motif.replace(/« .* »/, '« … »')]: (a[e.motif.replace(/« .* »/, '« … »')] ?? 0) + 1 }), {});
  console.log(`${ecartes.length} écartée(s) :`);
  for (const [m, n] of Object.entries(motifs).sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(3)} × ${m}`);
  console.log();
}

console.log('Pour en prendre une :');
console.log(`  npm run commons -- ${JSON.stringify(requete)} --prendre 1 --vers pays/nom-du-lieu.jpg --page /vietnam`);
