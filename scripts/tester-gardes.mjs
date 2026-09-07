#!/usr/bin/env node
/**
 * Les contrôles se contrôlent-ils encore ?
 *
 * Ce site repose sur quatorze contrôles bloquants. Chacun a été vérifié une
 * fois, à la main, le jour où il a été écrit — puis plus jamais. C'est
 * exactement la situation qu'ils existent pour empêcher : un mécanisme dont
 * personne ne revérifie qu'il fonctionne encore.
 *
 * Et la panne est silencieuse par construction. Un contrôle cassé ne dit rien.
 * Il affiche « ✓ », la mise en ligne passe, et la confiance qu'il inspire est
 * précisément ce qui rend la panne dangereuse : on cesse de regarder à la main
 * ce qu'on croit surveillé. Un contrôle qui ne bloque plus est pire que pas de
 * contrôle du tout.
 *
 * COMMENT
 * Pour chaque contrôle, on introduit volontairement le défaut qu'il doit
 * attraper, on le lance, et on exige deux choses : qu'il sorte en erreur, et
 * que son message nomme bien ce défaut-là. Un contrôle qui bloque pour une
 * autre raison n'est pas testé, il est confondu avec son voisin.
 *
 * Les fichiers sont restaurés systématiquement, y compris si un test échoue.
 * L'état du dépôt est vérifié avant et après : la suite refuse de tourner sur
 * un arbre modifié, et crie si elle laisse la moindre trace.
 *
 * AUCUNE RECONSTRUCTION
 * Chaque contrôle lit soit les sources, soit `dist/`. On mute la couche qu'il
 * lit, jamais l'autre : la suite entière tourne en quelques secondes, ce qui
 * est la condition pour qu'elle tourne à chaque poussée plutôt qu'une fois par
 * trimestre.
 *
 *   node scripts/tester-gardes.mjs
 *   node scripts/tester-gardes.mjs --seul "tarif"    un seul cas, par son nom
 */

import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const SEUL = args.includes('--seul') ? args[args.indexOf('--seul') + 1] : null;

/* ── Outils de mutation ─────────────────────────────────────────── */

/**
 * Un remplacement qui refuse d'échouer en silence.
 *
 * Si le motif ne correspond plus — parce que le texte visé a été réécrit —, la
 * mutation ne se ferait pas, le contrôle ne trouverait rien à redire, et le
 * test conclurait que le garde-fou est cassé. Le diagnostic serait faux et
 * coûterait une heure. On préfère dire tout de suite que c'est le test qui est
 * périmé, pas le contrôle.
 */
const remplacer = (motif, par) => (contenu) => {
  const sortie = contenu.replace(motif, par);
  if (sortie === contenu) {
    throw new Error(`le motif ${motif} ne correspond plus — c'est ce test qu'il faut mettre à jour`);
  }
  return sortie;
};

/** Insère du texte juste après la balise <body>, pour salir une page produite. */
const injecterDansLaPage = (html) =>
  remplacer(/<body[^>]*>/, (m) => `${m}${html}`);

/* ── Les cas ────────────────────────────────────────────────────── */

const CAS = [
  /* ── verifier-config.mjs ─────────────────────────────────────── */
  {
    nom: 'réglage attendu par le code mais jamais écrit',
    script: 'verifier-config.mjs',
    muter: {
      'src/data/site.ts': remplacer(
        /^const reglage =/m,
        "const _garde = import.meta.env.PUBLIC_GARDE_INEXISTANTE;\nconst reglage =",
      ),
    },
    attendu: /réglage\(s\) que le code attend/,
  },
  {
    nom: "le formulaire d'inscription perd son champ",
    script: 'verifier-config.mjs',
    muter: { 'dist/index.html': remplacer(/name="EMAIL"/g, 'name=""') },
    attendu: /défaut\(s\) dans le formulaire/,
  },
  {
    nom: 'le nombre de sources annoncé ne correspond plus',
    script: 'verifier-config.mjs',
    muter: {
      'src/data/countries.ts': remplacer(
        /url: 'https:\/\/www\.diplomatie\.gouv\.fr\/fr\/information-par-pays\/laos\/conseils-aux-voyageurs-entree-sejour' \}/,
        "url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/laos/conseils-aux-voyageurs-entree-sejour', surveillee: false }",
      ),
    },
    attendu: /nombre de sources annoncé/,
  },
  {
    nom: 'llms.txt disparaît',
    script: 'verifier-config.mjs',
    muter: { 'dist/llms.txt': () => null },
    attendu: /défaut\(s\) sur ce que lisent les machines/,
  },
  {
    nom: "un tarif d'entrée publié sans être surveillé",
    script: 'verifier-config.mjs',
    muter: {
      'src/data/countries.ts': remplacer(
        /cout: '≈ 36 USD \(e-visa, frais de service inclus\)/,
        "cout: '≈ 36 USD (e-visa, frais de service inclus) ; taxe de sortie de 18 USD",
      ),
    },
    attendu: /tarif\(s\) d'entrée publiés sans être surveillés/,
  },
  {
    nom: "la durée d'exemption ne correspond plus à sa phrase",
    script: 'verifier-config.mjs',
    muter: { 'src/data/countries.ts': remplacer(/sansVisaJours: 45,/, 'sansVisaJours: 44,') },
    attendu: /règle\(s\) de visa où le chiffre et la phrase divergent/,
  },
  {
    nom: 'une correction publiée mais absente de sa page',
    script: 'verifier-config.mjs',
    muter: {
      // Le contrôle lit la page que la correction nomme, pas une page au
      // hasard : la première version de ce test injectait le texte d'une
      // correction thaïlandaise dans la fiche du Vietnam, et concluait que le
      // garde-fou ne protégeait plus. C'est le test qui visait à côté.
      'dist/vietnam/index.html': (html) => {
        const c = readFileSync('src/data/corrections.ts', 'utf8');
        const bloc = c.slice(c.indexOf("page: '/vietnam'"));
        const avant = bloc.match(/avant:\s*\n?\s*(?:"([^"]{40,})"|'([^']{40,})')/);
        const texte = avant?.[1] ?? avant?.[2];
        if (!texte) throw new Error("aucune correction sur /vietnam avec un texte « avant » assez long");
        return injecterDansLaPage(`<p>${texte}</p>`)(html);
      },
    },
    attendu: /correction\(s\) publiée\(s\) mais pas appliquée/,
  },

  /* ── verifier-chiffres.mjs ───────────────────────────────────── */
  {
    nom: 'une entrée du registre devient illisible',
    script: 'verifier-chiffres.mjs',
    args: ['--hors-ligne'],
    muter: {
      'src/data/chiffres-cites.ts': remplacer(
        /designe: 'e-visa vietnamien, entrée simple \(USD\)'/,
        'designe: `e-visa vietnamien`',
      ),
    },
    attendu: /Registre illisible/,
  },
  {
    nom: 'un montant déclaré disparaît de sa page',
    script: 'verifier-chiffres.mjs',
    args: ['--hors-ligne'],
    muter: { 'dist/transports-asie/index.html': remplacer(/32 h 45/g, 'trente-deux heures') },
    attendu: /incohérence\(s\) dans le site lui-même/,
  },
  {
    nom: 'une page réaffiche un chiffre corrigé',
    script: 'verifier-chiffres.mjs',
    args: ['--hors-ligne'],
    muter: { 'dist/laos/index.html': injecterDansLaPage('<p>Hanoï–Saïgon, 33 heures de train.</p>') },
    attendu: /affichent encore un chiffre corrigé/,
  },

  /* ── garde-fous.mjs ──────────────────────────────────────────── */
  {
    nom: 'un article automatique sans source',
    script: 'garde-fous.mjs',
    muter: {
      'src/content/blog/_test-garde-fous.md': () =>
        [
          '---',
          'title: "Article de test des garde-fous"',
          'description: "Article temporaire créé par la suite de tests, supprimé aussitôt après son passage."',
          'accroche: "Il ne doit jamais atteindre le site."',
          'pubDate: ' + new Date().toISOString().slice(0, 10),
          'categorie: pratique',
          'redactionAutomatique: true',
          '---',
          '',
          'Un fait affirmé sans aucune source.',
          '',
        ].join('\n'),
    },
    attendu: /blocage\(s\)/,
  },

  /* ── performance.mjs ─────────────────────────────────────────── */
  {
    nom: 'une page dépasse son plafond de poids',
    script: 'performance.mjs',
    muter: {
      'dist/laos/index.html': (html) => html + `<!-- ${'x'.repeat(200_000)} -->`,
    },
    attendu: /plafond\(s\) dépassé\(s\)/,
  },

  /* ── verifier-liens.mjs ──────────────────────────────────────── */
  {
    nom: 'un lien interne pointe dans le vide',
    script: 'verifier-liens.mjs',
    muter: {
      'dist/laos/index.html': injecterDansLaPage('<a href="/cette-page-nexiste-pas">lien mort</a>'),
    },
    attendu: /./,
  },

  /* ── audit-seo.mjs ───────────────────────────────────────────── */
  {
    nom: 'une page perd son titre',
    script: 'audit-seo.mjs',
    muter: { 'dist/laos/index.html': remplacer(/<title>[^<]*<\/title>/, '<title></title>') },
    attendu: /./,
  },
];

/* ── Le harnais ─────────────────────────────────────────────────── */

const gitPropre = () => {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', 'src', 'scripts'], { encoding: 'utf8' }).trim() === '';
  } catch {
    return true; // hors dépôt : on ne bloque pas pour autant
  }
};

if (!gitPropre()) {
  console.error("⛔ L'arbre de travail contient des modifications non validées.\n");
  console.error('   Cette suite modifie des fichiers sources puis les restaure. Elle refuse');
  console.error('   de tourner sur un arbre sale : en cas d\'interruption, on ne saurait plus');
  console.error("   distinguer ce qu'elle a écrit de ce que vous étiez en train d'écrire.\n");
  process.exit(2);
}

if (!existsSync('dist')) {
  console.error("⛔ dist/ est absent : lancez `npm run build` d'abord.\n");
  process.exit(2);
}

const aTester = SEUL ? CAS.filter((c) => c.nom.includes(SEUL)) : CAS;
if (!aTester.length) {
  console.error(`Aucun cas ne correspond à « ${SEUL} ».`);
  process.exit(2);
}

console.log(`Les garde-fous du site — ${aTester.length} contrôle(s) mis à l'épreuve\n`);

const echecs = [];

for (const cas of aTester) {
  const avant = new Map();
  let verdict;

  try {
    // 1. Photographier, puis salir.
    for (const [chemin, muter] of Object.entries(cas.muter)) {
      avant.set(chemin, existsSync(chemin) ? readFileSync(chemin, 'utf8') : null);
      const nouveau = muter(avant.get(chemin) ?? '');
      if (nouveau === null) rmSync(chemin, { force: true });
      else writeFileSync(chemin, nouveau);
    }

    // 2. Lancer le contrôle. Une sortie non nulle est le résultat attendu :
    //    execFileSync la signale par une exception, pas par une valeur.
    let sortie = '';
    let code = 0;
    try {
      sortie = execFileSync('node', [`scripts/${cas.script}`, ...(cas.args ?? [])], {
        encoding: 'utf8',
        maxBuffer: 32 * 1024 * 1024,
      });
    } catch (e) {
      code = e.status ?? 1;
      sortie = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }

    // 3. Juger. Bloquer ne suffit pas : il faut bloquer pour la bonne raison.
    if (code === 0) verdict = { ok: false, motif: 'le défaut est passé sans être signalé' };
    else if (!cas.attendu.test(sortie)) {
      verdict = { ok: false, motif: `bloque, mais pour une autre raison que ${cas.attendu}` };
    } else verdict = { ok: true, code };
  } catch (e) {
    verdict = { ok: false, motif: e.message };
  } finally {
    // 4. Restaurer, quoi qu'il arrive.
    for (const [chemin, contenu] of avant) {
      if (contenu === null) rmSync(chemin, { force: true });
      else writeFileSync(chemin, contenu);
    }
  }

  const marque = verdict.ok ? '✓' : '✗';
  console.log(`  ${marque} ${cas.nom}`);
  if (!verdict.ok) {
    console.log(`      ${verdict.motif}`);
    console.log(`      contrôle : ${cas.script}`);
    echecs.push({ ...cas, ...verdict });
  }
}

/* ── Vérifier qu'on n'a rien laissé traîner ──────────────────────── */

console.log();
if (!gitPropre()) {
  console.error('⛔ La suite a laissé des fichiers modifiés. Restaurez avec :');
  console.error('   git checkout -- src scripts\n');
  process.exit(2);
}

if (echecs.length) {
  console.log(`⛔ ${echecs.length} garde-fou(s) sur ${aTester.length} ne protègent plus :\n`);
  for (const e of echecs) console.log(`   ${e.nom}\n      ${e.motif}`);
  console.log('\n   Un contrôle qui ne bloque plus est pire que pas de contrôle : il');
  console.log('   affiche « ✓ » et fait cesser la vérification à la main.\n');
  process.exit(1);
}

console.log(`✓ Les ${aTester.length} garde-fous testés bloquent bien le défaut qu'ils visent.\n`);
