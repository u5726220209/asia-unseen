#!/usr/bin/env node
/**
 * Le site tel qu'il sera quand tout aura paru.
 *
 * POURQUOI
 * Vingt-neuf textes anglais sont écrits et programmés sur onze semaines. Tant
 * qu'ils n'ont pas paru, ils n'ont pas de page — et la quasi-totalité des
 * contrôles lisent `dist/`. Ils regardent donc un site amputé de la moitié de
 * ce qui est écrit, et ils affichent « ✓ » en toute bonne foi.
 *
 * Ce n'est pas théorique. Cette simulation a trouvé, dès sa première
 * exécution, trois titres qui dépassent la limite affichée par Google. Aucun
 * autre contrôle ne pouvait les voir : leurs pages n'existaient pas. Ils
 * seraient apparus un à un, entre le 21 septembre et le 8 décembre, chacun le
 * matin de sa parution — c'est-à-dire le seul matin où plus personne ne relit.
 *
 * COMMENT
 * On décale toutes les dates de parution vers le passé, en conservant leur
 * ordre relatif — un texte qui devait paraître après un autre paraît toujours
 * après lui. On reconstruit, on lance la batterie, puis on restaure les dates
 * d'origine, y compris si un contrôle échoue.
 *
 * L'ordre relatif compte : c'est lui qui permet au contrôle des liens de voir
 * qu'un guide cite un article qui paraît plus tard. L'écraser rendrait la
 * simulation plus verte que la réalité, ce qui est pire qu'inutile.
 *
 * SÛRETÉ
 * La simulation refuse de tourner sur un arbre modifié : elle réécrit des
 * fichiers suivis, et il faut pouvoir distinguer ce qu'elle a écrit de ce que
 * vous étiez en train d'écrire. Elle vérifie aussi, en sortant, qu'elle n'a
 * rien laissé derrière elle.
 *
 *   node scripts/simuler-parutions.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { COLLECTIONS } from './lib/collections.mjs';

const MOTIF_DATE = /^pubDate: (\d{4}-\d{2}-\d{2})$/m;

/** Les contrôles qui lisent `dist/`, et qui ne voient donc rien d'un texte programmé. */
const BATTERIE = [
  ['verifier-liens.mjs', []],
  ['verifier-config.mjs', []],
  ['audit-seo.mjs', []],
  ['verifier-chiffres.mjs', ['--hors-ligne']],
  ['liens-affilies.mjs', ['--hors-ligne']],
  ['performance.mjs', []],
];

/* ── L'arbre doit être propre ───────────────────────────────────── */

const suivisModifies = () =>
  execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' })
    .split('\n')
    .map((l) => l.slice(3).trim())
    .filter(Boolean);

const sales = suivisModifies().filter((f) => f.startsWith('src/content/'));
if (sales.length) {
  console.error('⛔ Des textes sont modifiés et non validés :\n');
  for (const f of sales.slice(0, 10)) console.error(`   ${f}`);
  console.error('\n   Cette simulation réécrit les dates de parution puis les restaure.');
  console.error('   Sur un arbre modifié, elle ne pourrait plus distinguer ce qu\'elle a');
  console.error('   écrit de ce que vous étiez en train d\'écrire.\n');
  process.exit(2);
}

/* ── Décaler les dates, en gardant l'ordre ──────────────────────── */

const fichiers = [];
for (const { dossier } of COLLECTIONS) {
  if (!existsSync(dossier)) continue;
  for (const f of readdirSync(dossier).filter((f) => f.endsWith('.md'))) {
    const chemin = `${dossier}/${f}`;
    const contenu = readFileSync(chemin, 'utf8');
    const date = contenu.match(MOTIF_DATE)?.[1];
    if (date) fichiers.push({ chemin, contenu, date });
  }
}

const distinctes = [...new Set(fichiers.map((f) => f.date))].sort();
const hier = new Date(Date.now() - 86400000);
const table = new Map();
[...distinctes].reverse().forEach((d, i) => {
  const cible = new Date(hier.getTime() - i * 86400000);
  table.set(d, cible.toISOString().slice(0, 10));
});

const restaurer = () => {
  for (const f of fichiers) writeFileSync(f.chemin, f.contenu);
};

let code = 0;
try {
  for (const f of fichiers) {
    writeFileSync(f.chemin, f.contenu.replace(MOTIF_DATE, `pubDate: ${table.get(f.date)}`));
  }

  const programmes = fichiers.filter((f) => f.date > new Date().toISOString().slice(0, 10));
  console.log(`Simulation : ${fichiers.length} textes, dont ${programmes.length} encore programmés.`);
  console.log(`${distinctes.length} dates distinctes ramenées avant aujourd'hui, ordre conservé.\n`);

  execFileSync('npm', ['run', 'build'], { stdio: 'ignore' });

  for (const [script, args] of BATTERIE) {
    try {
      execFileSync('node', [`scripts/${script}`, ...args], { stdio: 'pipe' });
      console.log(`  ✓ ${script}`);
    } catch (e) {
      code = 1;
      console.log(`  ✗ ${script}`);
      const sortie = `${e.stdout ?? ''}${e.stderr ?? ''}`.trim();
      for (const ligne of sortie.split('\n').slice(0, 14)) console.log(`      ${ligne}`);
    }
  }
} finally {
  restaurer();
  const restes = suivisModifies().filter((f) => f.startsWith('src/content/'));
  if (restes.length) {
    console.error('\n⛔ La simulation a laissé des traces :');
    for (const f of restes) console.error(`   ${f}`);
    console.error('   Restaurez-les avec : git checkout -- src/content\n');
    code = 2;
  }
}

if (code === 0) {
  console.log('\n✓ Le site tel qu\'il sera quand tout aura paru passe la batterie.');
  console.log('  Pensez à reconstruire : les pages de `dist` sont celles de la simulation.\n');
} else {
  console.log('\n⛔ Des défauts n\'apparaîtront qu\'au fil des parutions. Corrigez-les maintenant.\n');
}
process.exit(code);
