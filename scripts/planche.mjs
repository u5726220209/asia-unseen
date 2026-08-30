#!/usr/bin/env node
/**
 * Planche de contact.
 *
 *   npm run planche -- "Angkor Wat" "Ta Prohm" > /dev/null
 *
 * Assemble les candidats publiables en une seule image numérotée, pour les
 * regarder ensemble plutôt qu'un par un. Une photo se choisit à l'œil : ni la
 * licence, ni la résolution, ni le titre ne disent si le cadrage sert la page.
 *
 * C'est aussi le seul moment où l'on peut voir ce que Commons n'a pas signalé —
 * un visage reconnaissable, une image floue, une scène qui ne montre pas du
 * tout ce que le titre annonce.
 */

import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { chercher, UA } from './lib/commons.mjs';

const args = process.argv.slice(2);
const lire = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const requetes = args.filter((a) => !a.startsWith('--') && args[args.indexOf(a) - 1]?.startsWith('--') !== true);
const sortie = lire('vers') ?? 'planche.jpg';
const parRequete = Number(lire('par') ?? 4);

const L = 420, H = 236, MARGE = 8;

const vignettes = [];
for (const q of requetes) {
  const { retenues } = await chercher(q, 30);
  for (const c of retenues.slice(0, parRequete)) vignettes.push({ ...c, requete: q });
}

if (!vignettes.length) { console.error('Aucun candidat publiable.'); process.exit(1); }

const colonnes = 3;
const lignes = Math.ceil(vignettes.length / colonnes);
const largeur = colonnes * (L + MARGE) + MARGE;
const hauteur = lignes * (H + MARGE) + MARGE;

const composites = [];
const manquantes = [];
for (const [i, v] of vignettes.entries()) {
  try {
    // Wikimedia limite le débit : sans cette pause, une vignette sur deux
    // revient vide et la planche donne une fausse idée du choix disponible.
    await new Promise((r) => setTimeout(r, 250));
    const r = await fetch(v.vignette, { headers: { 'User-Agent': UA } });
    if (!r.ok) throw new Error(String(r.status));
    const img = await sharp(Buffer.from(await r.arrayBuffer()))
      .resize(L, H, { fit: 'cover', position: sharp.strategy.attention })
      .jpeg().toBuffer();
    composites.push({
      input: img,
      left: MARGE + (i % colonnes) * (L + MARGE),
      top: MARGE + Math.floor(i / colonnes) * (H + MARGE),
    });
  } catch { manquantes.push(i + 1); }
}

await sharp({ create: { width: largeur, height: hauteur, channels: 3, background: '#111111' } })
  .composite(composites).jpeg({ quality: 86 }).toFile(sortie);

console.error(`planche : ${sortie} — ${composites.length} vignettes sur ${vignettes.length}, ${colonnes} par ligne`);
if (manquantes.length) console.error(`vignettes non chargées : ${manquantes.join(', ')} — les cases restent noires\n`);
else console.error('');
vignettes.forEach((v, i) => {
  console.error(`${String(i + 1).padStart(2)}. [${v.requete}] ${v.titre.slice(0, 62)}`);
  console.error(`    ${v.largeur}×${v.hauteur} · ${v.licence} · ${v.auteur.slice(0, 40)}`);
});
writeFileSync(sortie.replace(/\.jpg$/, '.json'), JSON.stringify(vignettes, null, 2));
