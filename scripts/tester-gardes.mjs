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

  {
    nom: "un nom de pays écrit sans son article",
    script: 'verifier-config.mjs',
    muter: {
      'dist/budget/japon/index.html': remplacer(
        /Le Japon parmi les neuf pays/,
        'Où se situe Japon parmi les neuf pays',
      ),
    },
    attendu: /faute\(s\) d'article/,
  },

  {
    nom: "une règle par passeport perd sa source",
    script: 'verifier-config.mjs',
    muter: {
      'src/data/countries.ts': remplacer(
        /source: \{ label: "GOV\.UK — conseils aux voyageurs, conditions d'entrée", url: '[^']+' \},/,
        'source: { label: "GOV.UK", url: \'\' },',
      ),
    },
    attendu: /aucune source officielle/,
  },
  {
    nom: "la règle française dupliquée dans regles",
    script: 'verifier-config.mjs',
    muter: {
      // Deux sources de vérité pour la même règle : elles divergeraient, et ce
      // dépôt a déjà payé ce prix sur la description des fiches pays.
      'src/data/countries.ts': remplacer(/^ {8}ca: \{$/m, '        fr: {'),
    },
    attendu: /la règle française vit dans `visa`/,
  },

  {
    nom: "une page déclare une traduction qui n'existe pas",
    script: 'verifier-config.mjs',
    // Une balise hreflang vers une page absente est pire que pas de balise :
    // Google la suit, trouve un 404, et cesse de croire les autres.
    muter: { 'dist/en/index.html': () => null },
    attendu: /déclare une version à \/en, qui n'existe pas/,
  },

  {
    nom: 'un texte programmé cite un texte qui paraît plus tard',
    script: 'verifier-liens.mjs',
    /* Un lien entre deux textes programmés était considéré comme valide, sans
       regarder l'ordre. Vingt-neuf textes anglais s'attendent sur onze
       semaines : deux paires paraissaient trois jours avant l'article qu'elles
       citaient, et le lien aurait été mort le matin de leur parution — le seul
       matin où plus personne ne relit. */
    muter: {
      'src/content/blog-en/ha-giang-loop-four-days.md':
        remplacer(/^pubDate: 2026-10-24$/m, 'pubDate: 2026-10-27'),
    },
    attendu: /qui ne paraît que le 2026-10-27/,
  },

  {
    nom: 'un guide anglais programmé contient un lien mort',
    script: 'verifier-liens.mjs',
    /* Le contrôle déduisait l'adresse du nom du dossier et ignorait donc
       `blog-en` et `guides-en` en silence. Vingt-deux articles anglais et sept
       guides n'avaient jamais vu leurs liens vérifiés. */
    muter: {
      'src/content/guides-en/esim-for-asia.md':
        remplacer(/\/en\/blog\/esim-asia-price-comparison/, '/en/blog/esim-prices'),
    },
    attendu: /\/en\/blog\/esim-prices/,
  },

  {
    nom: "un montant disparaît d'un texte encore programmé",
    script: 'verifier-chiffres.mjs',
    args: ['--hors-ligne'],
    /* Une page programmée n'a pas de HTML, mais elle a son markdown. Sans cette
       lecture, un chiffre inscrit au registre pour un guide qui paraît dans
       onze semaines n'était contrôlé qu'onze semaines plus tard — le matin de
       la parution, quand plus personne ne relit. */
    muter: {
      'src/content/guides-en/getting-around-asia.md': remplacer(/1,726 km/, '1,700 km'),
    },
    attendu: /absent du texte programmé/,
  },

  {
    nom: "un article anglais cite un original qui n'existe pas",
    script: 'verifier-config.mjs',
    /* Celui-ci lit les fichiers et non `dist` : il voit la faute le jour où
       elle est écrite, pas le jour de la parution — c'est-à-dire avant que le
       bouton de langue ne renvoie un lecteur sur un 404. */
    muter: {
      'src/content/blog-en/where-to-stay-hanoi.md':
        remplacer(/^traduitDe: ou-dormir-a-hanoi$/m, 'traduitDe: ou-dormir-a-hanoi-v2'),
    },
    attendu: /citent un original qui n'existe pas/,
  },

  {
    nom: 'une paire traduite ne se déclare pas',
    script: 'verifier-config.mjs',
    /* On avance la date d'un article anglais encore programmé : sa page n'est
       donc pas dans `dist`, alors que son original français y est. C'est le cas
       réel d'une reconstruction nocturne qui n'a pas eu lieu — la date est
       venue, la page anglaise n'existe pas, et rien à l'écran ne le dit.

       Le jour où cet article sera réellement paru, la mutation ne produira plus
       de défaut et ce test échouera bruyamment. C'est voulu : il faudra alors
       le refaire porter sur une paire publiée, en retirant la balise `alternate`
       de l'une des deux pages. */
    muter: {
      'src/content/blog-en/esim-asia-price-comparison.md':
        remplacer(/^pubDate: 2026-11-17$/m, 'pubDate: 2026-01-01'),
    },
    attendu: /ne le disent pas/,
  },

  {
    nom: 'le journal anglais oublie une correction',
    script: 'verifier-config.mjs',
    /* La page anglaise annonce un nombre de corrections et les liste toutes.
       Une entrée manquante en ferait un journal partiel présenté comme entier,
       sur la page dont le métier est précisément de prouver que le site dit ce
       qu'il a eu faux. */
    muter: {
      'src/data/corrections.en.ts':
        remplacer(/^ {2}'c-2026-08-30-laos': \{$/m, "  'c-2026-08-30-laos-x': {"),
    },
    attendu: /c-2026-08-30-laos n'a pas de version anglaise/,
  },

  {
    nom: 'la date remontée par la machine vise le mauvais champ',
    script: 'rafraichir.mjs',
    args: ['--verifier'],
    /* Ce script écrit dans `countries.ts` à des positions calculées. Une
       position juste-à-côté n'échoue pas : elle écrit une date exacte sur le
       mauvais champ, le fichier reste valide, et le site affiche une date qui
       ment. C'est arrivé — l'arrivée des règles par passeport a glissé « la
       première date après le slug » de la fiche vers le passeport
       britannique. */
    muter: {
      /* On réintroduit le défaut là où il était : dans le repérage lui-même.
         « La première date après le slug » désignait la fiche tant qu'elle
         était seule à en porter une ; elle désigne aujourd'hui le passeport
         britannique. */
      'scripts/rafraichir.mjs': remplacer(
        /const apresSources = bloc\.indexOf\('\],', i\);/,
        'const apresSources = 0;',
      ),
    },
    attendu: /ne suit pas ses sources|est celle d'une règle par passeport/,
  },

  {
    nom: 'un fichier de données oublie un passeport',
    script: 'verifier-config.mjs',
    /* Le fichier ne portait qu'une règle, sans dire de quel passeport. Une
       machine qui l'ouvrait pour répondre à « combien de jours au Vietnam »
       citait une durée française comme si elle valait pour tout le monde —
       l'erreur même que ce site existe pour empêcher, produite par le fichier
       qu'il publie pour être cité. */
    muter: {
      'dist/donnees/laos.json': (contenu) => {
        const d = JSON.parse(contenu);
        delete d.visa.parPasseport.gb;
        return JSON.stringify(d, null, 2);
      },
    },
    attendu: /ne dit rien du passeport gb/,
  },

  {
    nom: 'llms.txt ne dit pas qu\'il existe une version anglaise',
    script: 'verifier-config.mjs',
    /* Le fichier existe pour qu'un moteur génératif sache d'où vient une règle
       et de quand elle date. Tant qu'il annonçait un site « pour des lecteurs
       francophones », un modèle cherchant une règle en anglais lisait cette
       phrase et allait voir ailleurs — alors que la réponse était là, avec sa
       source et sa date. Rien n'était faux ; le fichier était muet. */
    muter: { 'dist/llms.txt': remplacer(/\/en\//g, '/xx/') },
    attendu: /llms\.txt n'en cite aucune/,
  },

  {
    nom: "la cellule d'entrée cesse de suivre le sélecteur",
    script: 'verifier-config.mjs',
    /* Deux affichages de la même règle, à deux écrans d'intervalle. Celui du
       haut est celui qu'on croit : plus gros, et premier. Le lien entre les
       deux tient à une classe et un attribut ; s'ils disparaissent, rien ne
       casse — la cellule affiche une règle qui ne bouge plus, et personne ne
       le voit tant qu'il ne compare pas. */
    muter: {
      'dist/en/vietnam/index.html': remplacer(/au-pp-entree/, 'au-pp-entree-x'),
    },
    attendu: /ne suit pas le sélecteur/,
  },

  {
    nom: 'une page anglaise propose la lettre française',
    script: 'verifier-config.mjs',
    /* La lettre est en français et la liste aussi, jusqu'au `locale=fr` qui
       fixe la langue des messages d'erreur. Recueillir une adresse anglophone
       là-dessus, c'est promettre une lettre que la personne ne pourra pas
       lire. Deux mécanismes l'ont fait sans que personne le voie : le bloc de
       capture des outils et la pop-up de sortie. */
    muter: {
      'dist/en/vietnam/index.html':
        remplacer(/<\/body>/, '<form class="au-nl"></form></body>'),
    },
    attendu: /proposent la lettre française/,
  },

  {
    nom: 'un lien anglais vers le français ne dit pas sa langue',
    script: 'verifier-config.mjs',
    /* Le site propose délibérément des liens vers sa version française. Ce qui
       ne va pas, c'est qu'ils ressemblent aux autres : un lecteur anglophone
       clique, arrive sur une page qu'il ne lit pas, et conclut que la version
       anglaise est un décor posé sur un site français. */
    muter: {
      'dist/en/vietnam/index.html': remplacer(/ hreflang="fr" lang="fr"/, ''),
    },
    attendu: /sans le dire/,
  },

  {
    nom: 'une date française apparaît sur une page anglaise',
    script: 'verifier-config.mjs',
    /* Le défaut ne vient pas d'un texte oublié mais d'un gabarit : un composant
       qui formate en `fr-FR` en dur et qu'on réutilise côté anglais. Les motifs
       du contrôle précédent cherchent des phrases du site et laissaient donc
       passer « 1 septembre 2026 ». En le cherchant, on a trouvé deux fiches
       pays qui affichaient des phrases entières en français. */
    muter: {
      'dist/en/vietnam/index.html': remplacer(/Taken in September 2026/, 'Relevé le 3 septembre 2026'),
    },
    attendu: /3 septembre 2026/,
  },

  {
    nom: 'du français reste sur une page anglaise',
    script: 'verifier-config.mjs',
    // Une page à moitié traduite fait douter de ses chiffres, qui sont justes.
    muter: { 'dist/en/vietnam/index.html': remplacer(/United Kingdom/, 'Royaume-Uni') },
    attendu: /français sur des pages anglaises/,
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

  {
    nom: 'un article programmé contient un lien mort',
    script: 'verifier-liens.mjs',
    muter: {
      // Un article qui attend sa date n'a pas encore de page : ses liens
      // échappaient au contrôle jusqu'au matin de sa parution, c'est-à-dire
      // jusqu'au moment où plus personne ne le relit.
      'src/content/blog/_test-lien-programme.md': () =>
        [
          '---',
          'title: "Article programmé de test"',
          'description: "Article temporaire créé par la suite de tests pour vérifier que les liens des articles à paraître sont contrôlés."',
          'accroche: "Il ne doit jamais atteindre le site."',
          'pubDate: ' + new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
          'categorie: pratique',
          '---',
          '',
          'Un [lien vers nulle part](/cette-page-nexiste-vraiment-pas).',
          '',
        ].join('\n'),
    },
    attendu: /cette-page-nexiste-vraiment-pas/,
  },

  /* ── audit-seo.mjs ───────────────────────────────────────────── */
  {
    nom: "une page annonce une image de partage qui n'existe pas",
    script: 'audit-seo.mjs',
    /* Le contrôle vérifiait qu'une balise `og:image` est là, jamais que le
       fichier existe. Une page pouvait donc annoncer une image et servir un
       404 — défaut invisible sur le site, visible uniquement chez le
       destinataire à qui on envoie le lien, au seul instant où l'on voulait
       faire bonne impression. */
    muter: { 'dist/og/en/vietnam.png': () => null },
    attendu: /og\/en\/vietnam\.png/,
  },

  {
    nom: 'une page perd son titre',
    script: 'audit-seo.mjs',
    muter: { 'dist/laos/index.html': remplacer(/<title>[^<]*<\/title>/, '<title></title>') },
    attendu: /./,
  },
];

/* ── Le harnais ─────────────────────────────────────────────────── */

/**
 * Les seuls fichiers versionnés que la suite va toucher.
 *
 * La première version exigeait un arbre propre sur `src/` et `scripts/`
 * entiers. C'était trop large : écrire un article empêchait de lancer la
 * suite, alors qu'elle n'allait jamais s'approcher de ce fichier. Une
 * vérification qui interdit de travailler finit contournée, donc désarmée.
 *
 * On ne regarde donc que ce qui est réellement muté. Ce qui est sous `dist/`
 * n'est pas versionné et se restaure depuis la copie prise en mémoire.
 */
const fichiersTouches = [
  ...new Set(CAS.flatMap((c) => Object.keys(c.muter)).filter((f) => !f.startsWith('dist/'))),
];

const salis = () => {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', ...fichiersTouches], { encoding: 'utf8' })
      .trim()
      .split('\n')
      .filter(Boolean);
  } catch {
    return []; // hors dépôt : on ne bloque pas pour autant
  }
};

const gitPropre = () => salis().length === 0;

if (!gitPropre()) {
  console.error('⛔ Des fichiers que cette suite doit modifier sont déjà en cours de modification :\n');
  for (const l of salis()) console.error(`   ${l}`);
  console.error('\n   Elle les salit puis les restaure. En cas d\'interruption, on ne saurait');
  console.error("   plus distinguer ce qu'elle a écrit de ce que vous étiez en train d'écrire.");
  console.error('   Validez ou remisez ces fichiers-là ; le reste de votre travail ne la gêne pas.\n');
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
  console.error('⛔ La suite a laissé des fichiers modifiés :\n');
  for (const l of salis()) console.error(`   ${l}`);
  console.error('\n   Restaurez-les avec « git checkout -- <fichier> ».\n');
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
