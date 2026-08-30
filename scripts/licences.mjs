#!/usr/bin/env node
/**
 * La sentinelle des licences photographiques.
 *
 * Une licence relevée un jour n'est pas acquise pour toujours. Sur Wikimedia
 * Commons, un fichier peut être supprimé pour violation de droits, une licence
 * corrigée après coup, un auteur renommé. Le site continue alors d'afficher une
 * image dont le crédit est faux — ou dont la publication n'est plus permise.
 *
 * Rien ne le signale, et personne ne relit un crédit. C'est exactement la même
 * situation que les tarifs cités dans les comparatifs, et elle appelle la même
 * réponse : on déclare ce qu'on a constaté, avec la date, et une machine
 * revérifie que c'est toujours vrai.
 */

import { readFileSync } from 'node:fs';

const UA = 'AsiaUnseen/1.0 (https://asiaunseen.com; contact@racinesvietnam.com)';
const API = 'https://commons.wikimedia.org/w/api.php';

/** Au-delà, une licence mérite d'être reconstatée même si rien n'a bougé. */
const MOIS_AVANT_RECONTROLE = 12;

const ts = readFileSync('src/data/photos.ts', 'utf8');
const corps = ts.slice(ts.indexOf('export const photos'));

const photos = [...corps.matchAll(/\{\s*fichier:\s*'([^']+)'([\s\S]*?)\n  \},/g)]
  .filter((m) => !m[0].split('\n')[0].trimStart().startsWith('//'))
  .map((m) => {
    const bloc = m[2];
    const champ = (n) => bloc.match(new RegExp(`${n}:\\s*'([^']*)'`))?.[1];
    return {
      fichier: m[1],
      licence: bloc.match(/licence:\s*\{\s*nom:\s*'([^']*)'/)?.[1],
      origine: champ('origine'),
      releveLe: champ('releveLe'),
      auteur: bloc.match(/auteur:\s*["']([^"']*)["']/)?.[1],
    };
  });

if (!photos.length) {
  console.log('Aucune photographie déclarée. Le site tourne sur ses illustrations.');
  process.exit(0);
}

const sansBalises = (s) => (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const moisDepuis = (d) => Math.floor((Date.now() - new Date(d)) / 2_629_800_000);

const alertes = [];
const perimees = [];
const ok = [];

for (const p of photos) {
  if (!p.origine || !p.licence) {
    alertes.push({ ...p, motif: 'ni licence ni origine déclarées' });
    continue;
  }
  if (p.releveLe && moisDepuis(p.releveLe) >= MOIS_AVANT_RECONTROLE) {
    perimees.push({ ...p, mois: moisDepuis(p.releveLe) });
  }
  if (!/commons\.wikimedia\.org/.test(p.origine)) { ok.push(p); continue; }

  const titre = decodeURIComponent(p.origine.split('/wiki/')[1] ?? '');
  const url = new URL(API);
  url.search = new URLSearchParams({
    action: 'query', format: 'json', titles: titre,
    prop: 'imageinfo', iiprop: 'extmetadata',
  }).toString();

  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    const page = Object.values((await r.json())?.query?.pages ?? {})[0];

    if (!page || page.missing !== undefined) {
      alertes.push({ ...p, motif: 'le fichier a disparu de Commons' });
      continue;
    }
    const meta = page.imageinfo?.[0]?.extmetadata ?? {};
    const actuelle = sansBalises(meta.LicenseShortName?.value);
    const restrictions = sansBalises(meta.Restrictions?.value);

    if (actuelle && actuelle !== p.licence) {
      alertes.push({ ...p, motif: `licence passée de « ${p.licence} » à « ${actuelle} »` });
    } else if (/personality/i.test(restrictions)) {
      alertes.push({ ...p, motif: 'Commons signale désormais une personne identifiable' });
    } else {
      ok.push(p);
    }
  } catch {
    ok.push(p); // Commons injoignable : on ne conclut rien.
  }
}

console.log(`Licences photographiques — ${photos.length} images déclarées\n`);

if (alertes.length) {
  console.log(`⛔ ${alertes.length} image(s) à traiter :\n`);
  for (const a of alertes) {
    console.log(`   ${a.fichier}`);
    console.log(`   ${a.motif}`);
    if (a.origine) console.log(`   ${a.origine}`);
    console.log();
  }
  console.log('   Retirez la déclaration dans src/data/photos.ts : l\'emplacement');
  console.log('   retombera sur son illustration, et rien ne cassera.\n');
} else {
  console.log('✓ Toutes les licences déclarées tiennent encore.\n');
}

if (perimees.length) {
  console.log(`   ${perimees.length} relevé(s) de plus de ${MOIS_AVANT_RECONTROLE} mois — à reconstater :`);
  for (const p of perimees) console.log(`     ${p.fichier} — relevé il y a ${p.mois} mois`);
  console.log();
}

process.exit(alertes.length ? 1 : 0);
