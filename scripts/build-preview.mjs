/**
 * Build de préversion, pour un sous-domaine temporaire.
 *
 *   node scripts/build-preview.mjs https://mon-sous-domaine.example.com
 *
 * Différences avec `npm run build` :
 *   · les URL canoniques, le plan du site et le flux RSS pointent vers le
 *     domaine temporaire et non vers asiaunseen.com ;
 *   · tout le site passe en `noindex, nofollow` et robots.txt bloque tout.
 *
 * Sans ça, un sous-domaine indexable dupliquerait l'intégralité du contenu et
 * pénaliserait le domaine définitif au moment du lancement.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

const url = process.argv[2];
if (!url || !/^https?:\/\//.test(url)) {
  console.error('Usage : node scripts/build-preview.mjs <url-complète-avec-protocole>');
  process.exit(1);
}
const origin = url.replace(/\/$/, '');

rmSync('dist', { recursive: true, force: true });

const env = { ...process.env, PUBLIC_SITE_URL: origin, PUBLIC_NOINDEX: '1' };

execFileSync('npx', ['astro', 'build'], { stdio: 'inherit', env });

// L'index de recherche se construit à partir du HTML produit : il doit être
// régénéré à chaque build, y compris ici. Sans cette ligne, la préversion
// partirait sans /pagefind/ et la recherche renverrait des 404.
execFileSync('npx', ['pagefind', '--site', 'dist', '--output-subdir', 'pagefind'], {
  stdio: 'inherit',
  env,
});

writeFileSync(
  'dist/robots.txt',
  `# Déploiement de préversion — ${origin}
# Ce site est un miroir temporaire : il ne doit jamais être indexé.
# Le robots.txt de production se trouve dans public/robots.txt.

User-agent: *
Disallow: /
`,
);

console.log(`\n✓ Préversion construite pour ${origin} — indexation bloquée.`);
