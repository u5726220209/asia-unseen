/**
 * Construit le site et produit une archive prête à téléverser.
 *
 *   npm run package                 → build de production (asiaunseen.com)
 *   npm run package -- <url>        → build de préversion, en noindex
 *
 * L'archive obtenue s'installe de deux façons, toutes deux gratuites :
 *   · hPanel Hostinger → Gestionnaire de fichiers → public_html → Téléverser,
 *     puis « Extraire » ;
 *   · ou en demandant le déploiement dans Claude Code, qui dispose du
 *     connecteur Hostinger.
 */
import { execFileSync } from 'node:child_process';
import { rmSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const cible = process.argv[2];
const estPreversion = Boolean(cible);

if (cible && !/^https?:\/\//.test(cible)) {
  console.error('Usage : npm run package -- https://mon-domaine-temporaire.example.com');
  process.exit(1);
}

rmSync('dist', { recursive: true, force: true });

if (estPreversion) {
  execFileSync('node', ['scripts/build-preview.mjs', cible], { stdio: 'inherit' });
} else {
  execFileSync('npx', ['astro', 'build'], { stdio: 'inherit' });
}

// Un lien interne cassé ne fait pas échouer le build d'Astro : on le bloque ici,
// avant la mise en ligne, plutôt qu'en production.
execFileSync('node', ['scripts/verifier-liens.mjs'], { stdio: 'inherit' });

const d = new Date();
const p2 = (n) => String(n).padStart(2, '0');
const horodatage =
  `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}` +
  `_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
const archive = `dist_${horodatage}.zip`;

execFileSync('zip', ['-rq', join('..', archive), '.'], { cwd: 'dist', stdio: 'inherit' });

const taille = (statSync(archive).size / 1024 / 1024).toFixed(1);
const pages = readdirSync('dist', { recursive: true }).filter((f) => String(f).endsWith('.html')).length;

console.log(`
──────────────────────────────────────────────────────────────
  ${archive}   ·   ${taille} Mo   ·   ${pages} pages
  Mode : ${estPreversion ? `préversion (${cible}) — indexation bloquée` : 'production (asiaunseen.com)'}

  Pour mettre en ligne, au choix :
   1. hPanel → Gestionnaire de fichiers → public_html → Téléverser,
      puis clic droit sur l'archive → Extraire
   2. Demander « déploie l'archive » dans Claude Code
──────────────────────────────────────────────────────────────`);
