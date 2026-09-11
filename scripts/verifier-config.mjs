#!/usr/bin/env node
/**
 * Les noms des réglages doivent concorder.
 *
 * Le code lit des variables d'environnement ; les workflows les écrivent
 * depuis les secrets du dépôt. Rien ne garantit que les deux listes se
 * correspondent, et c'est exactement le genre d'écart qui ne fait aucun bruit :
 * si un workflow écrit PUBLIC_ADSENSE_SLOT_ARTICLE alors que le code lit
 * PUBLIC_ADSENSE_SLOT_IN_ARTICLE, le site se construit sans erreur et l'encart
 * publicitaire disparaît. On ne le découvre qu'à la facture, des semaines plus
 * tard, sans savoir depuis quand.
 *
 * Ce contrôle compare les deux listes et refuse l'écart dans les deux sens :
 * un réglage lu mais jamais écrit est une fonctionnalité morte en production ;
 * un réglage écrit mais jamais lu est un secret que quelqu'un croit utile.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { PREFIXES, TRADUITES } from './lib/collections.mjs';

const lire = (motif) =>
  execFileSync('bash', ['-c', motif], { encoding: 'utf8' }).split('\n').filter(Boolean);

const noms = (fichiers) => {
  const trouves = new Set();
  for (const f of fichiers) {
    for (const m of readFileSync(f, 'utf8').matchAll(/PUBLIC_[A-Z_0-9]+/g)) trouves.add(m[0]);
  }
  return trouves;
};

const lus = noms(lire('grep -rl "PUBLIC_" src astro.config.mjs 2>/dev/null'));
const ecrits = noms(lire('ls .github/workflows/*.yml'));

/**
 * PUBLIC_NOINDEX n'existe que pour les préversions : il doit rester absent de
 * la production, sans quoi le site entier se retire de Google. Son absence des
 * workflows est donc voulue, et c'est la seule exception admise.
 */
const EXCEPTIONS = new Set(['PUBLIC_NOINDEX']);

const jamaisEcrits = [...lus].filter((n) => !ecrits.has(n) && !EXCEPTIONS.has(n)).sort();
const jamaisLus = [...ecrits].filter((n) => !lus.has(n)).sort();

console.log(`Réglages — ${lus.size} lus par le code, ${ecrits.size} écrits par les workflows\n`);

if (jamaisEcrits.length) {
  console.log(`⛔ ${jamaisEcrits.length} réglage(s) que le code attend et qu'aucun workflow ne fournit :\n`);
  for (const n of jamaisEcrits) console.log(`   ${n}`);
  console.log('\n   En production, ces valeurs seront vides. Selon le réglage, cela veut dire');
  console.log('   une publicité qui ne s\'affiche pas, un lien affilié sans commission,');
  console.log('   ou une vérification Search Console qui saute.\n');
}

if (jamaisLus.length) {
  console.log(`⚠  ${jamaisLus.length} réglage(s) écrit(s) par un workflow et lu(s) par personne :\n`);
  for (const n of jamaisLus) console.log(`   ${n}`);
  console.log('\n   Soit le nom est mal orthographié — et le vrai réglage est donc vide —,');
  console.log('   soit ce secret ne sert plus à rien et peut être retiré.\n');
}

if (!jamaisEcrits.length && !jamaisLus.length) console.log('✓ Les deux listes concordent.\n');

/* ── Le formulaire produit est-il utilisable ? ──────────────────── */

/**
 * Des noms qui concordent ne suffisent pas : encore faut-il que la valeur
 * arrive jusqu'à la page.
 *
 * Le cas qui a motivé ce contrôle : `champEmail: env.PUBLIC_NEWSLETTER_CHAMP
 * ?? 'EMAIL'`. `??` ne se déclenche pas sur une chaîne vide, et un workflow
 * qui écrit `CHAMP=${secrets.CHAMP}` produit une chaîne vide quand le secret
 * n'existe pas. Le champ e-mail sortait donc avec un attribut `name` sans
 * valeur. Le formulaire partait, Brevo répondait, la page de remerciement
 * s'affichait — et pas une seule inscription n'était enregistrée. Rien, nulle
 * part, n'aurait signalé la perte.
 *
 * On ne relit donc pas le code : on relit le HTML produit.
 */
const defautsFormulaire = [];
if (existsSync('dist')) {
  const pages = execFileSync('bash', ['-c', 'ls dist/index.html dist/newsletter/index.html dist/vietnam/index.html 2>/dev/null'], { encoding: 'utf8' })
    .split('\n').filter(Boolean);

  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    for (const champ of html.match(/<input[^>]*type="email"[^>]*>/g) ?? []) {
      const nom = champ.match(/\sname="([^"]*)"/)?.[1];
      if (!nom) defautsFormulaire.push({ page, motif: 'le champ e-mail n\'a pas de nom exploitable' });
    }
    // Un formulaire branché doit aussi porter html_type=simple, sans quoi Brevo
    // attend un script maison que ce site ne charge pas, et la redirection de
    // confirmation ne part jamais.
    //
    // Le contrôle ne visait que la classe `au-nl`. La veille personnelle des
    // fiches pays porte `au-vp` : elle serait passée à travers, et c'est
    // exactement le genre d'angle mort qui rend un contrôle rassurant plutôt
    // qu'utile. On teste donc toute soumission vers un service externe.
    for (const f of html.match(/<form[^>]*action="https?:[^"]*"[^>]*>/g) ?? []) {
      if (!/class="au-(nl|vp)/.test(f)) continue;
      if (!html.includes('name="html_type" value="simple"')) {
        defautsFormulaire.push({ page, motif: 'formulaire branché sans html_type=simple' });
      }
    }

    // La date de départ doit partir au format que Brevo exige — jj-mm-aaaa, là
    // où <input type="date"> produit aaaa-mm-jj. Un attribut mal formé est
    // rejeté sans bruit : l'inscription réussit, la date se perd.
    //
    // Le contrôle cherchait d'abord la classe de conversion n'importe où dans
    // la page. Elle y figure aussi dans le script qui s'en sert, si bien qu'il
    // constatait sa propre existence et ne pouvait jamais échouer. On vise
    // maintenant la balise elle-même.
    for (const champ of html.match(/<input[^>]*name="DATE_DEPART"[^>]*>/g) ?? []) {
      if (!/au-vp-date-brevo/.test(champ)) {
        defautsFormulaire.push({ page, motif: 'DATE_DEPART sans conversion jj-mm-aaaa' });
      }
    }
  }
}

if (defautsFormulaire.length) {
  console.log(`⛔ ${defautsFormulaire.length} défaut(s) dans le formulaire d'inscription produit :\n`);
  for (const d of defautsFormulaire) console.log(`   ${d.motif}\n      ${d.page}`);
  console.log('\n   Une inscription partirait sans être enregistrée, et personne');
  console.log('   ne le verrait : la page de remerciement s\'affiche quand même.\n');
} else if (existsSync('dist')) {
  console.log('✓ Le formulaire produit porte un nom de champ et le type attendu.\n');
}

/* ── Le chiffre annoncé au lecteur est-il celui que la machine surveille ? ─ */

/**
 * La page « Devenir vérificateur » annonce « ce site relit chaque jour N pages
 * officielles ». C'est un argument de confiance : il doit être vrai.
 *
 * Le premier calcul en donnait seize là où la veille en lit vingt-cinq — il
 * oubliait les pages « Contacts utiles » déclarées sous `urgences.source`. Un
 * écart de cette nature ne se voit pas : les deux nombres sont plausibles, ils
 * vivent dans deux fichiers différents, et rien ne les confronte. D'où ce
 * contrôle, qui compare la phrase publiée à la liste réellement surveillée.
 */
let ecartSources = null;
if (existsSync('dist/verifier/index.html')) {
  const html = readFileSync('dist/verifier/index.html', 'utf8').replace(/<[^>]+>/g, ' ');
  const annonce = Number(html.match(/relit chaque jour\s+(\d+)\s+pages officielles/)?.[1]);

  const src = readFileSync('scripts/veille.mjs', 'utf8');
  const debut = src.indexOf('async function sourcesDuSite');
  const fin = src.indexOf('/* ── Normalisation');
  const extraire = new Function(
    'readFileSync', 'existsSync',
    src.slice(debut, fin).replace('async function sourcesDuSite', 'return async function sourcesDuSite'),
  )(readFileSync, existsSync);
  const reelles = (await extraire()).length;

  if (!Number.isFinite(annonce)) ecartSources = { annonce: 'introuvable', reelles };
  else if (annonce !== reelles) ecartSources = { annonce, reelles };
}

if (ecartSources) {
  console.log('⛔ Le nombre de sources annoncé au lecteur ne correspond pas à la réalité :\n');
  console.log(`   annoncé sur /verifier : ${ecartSources.annonce}`);
  console.log(`   réellement surveillé  : ${ecartSources.reelles}\n`);
  console.log('   Voir nbSourcesSurveillees dans src/lib/fraicheur.ts, qui doit compter');
  console.log('   exactement ce que sourcesDuSite() extrait dans scripts/veille.mjs.\n');
} else if (existsSync('dist/verifier/index.html')) {
  console.log('✓ Le nombre de sources annoncé est celui qui est surveillé.\n');
}

/* ── L'entier de l'exemption dit-il la même chose que la phrase ? ── */

/**
 * `visa.sansVisaJours` est transcrit de `visa.duree`. Deux écritures de la même
 * règle, dans le même objet, et rien ne les oblige à rester d'accord.
 *
 * Le jour où une exemption passe de soixante à trente jours, c'est la phrase
 * qu'on corrige — elle est lue par des humains, elle saute aux yeux. L'entier,
 * lui, ne se voit pas : il continuerait de répondre « aucun visa nécessaire »
 * pour un séjour de quarante jours devenu illégal. C'est le pire type d'erreur
 * que ce site puisse produire, et elle serait invisible.
 *
 * On vérifie donc que le nombre figure bien dans le texte. Zéro est le cas
 * particulier — « un visa est exigé dès le premier jour » ne s'écrit pas avec
 * un zéro — et se reconnaît à l'absence de « sans visa » dans la phrase.
 */
const visasIncoherents = [];
{
  const ts = readFileSync('src/data/countries.ts', 'utf8');
  for (const m of ts.matchAll(/slug: '([a-z-]+)'/g)) {
    const bloc = ts.slice(m.index, m.index + 8000);
    const i = bloc.indexOf('visa: {');
    if (i < 0) continue;
    const visa = bloc.slice(i, bloc.indexOf('\n    },', i));
    const duree = (visa.match(/duree:\s*"([^"]*)"/) ?? visa.match(/duree:\s*'([^']*)'/))?.[1] ?? '';
    const n = Number(visa.match(/sansVisaJours:\s*(\d+)/)?.[1] ?? NaN);
    if (!Number.isFinite(n)) { visasIncoherents.push({ pays: m[1], motif: 'sansVisaJours absent' }); continue; }

    const sansVisa = /sans visa|sans démarche|exemption/i.test(duree);
    if (n === 0 && sansVisa) {
      visasIncoherents.push({ pays: m[1], motif: 'annoncé à 0 alors que la phrase parle d\'exemption', duree });
    } else if (n > 0 && !new RegExp(`\\b${n}\\b`).test(duree)) {
      visasIncoherents.push({ pays: m[1], motif: `${n} ne figure pas dans la phrase`, duree });
    }

    // Une règle datée bascule toute seule le jour dit. Si le second régime
    // n'est pas annoncé dans la phrase, la fiche changera de réponse un matin
    // sans que rien ne l'ait dit au lecteur — exactement le contraire de ce
    // que ce site promet.
    const apres = visa.match(/sansVisaJoursApres:\s*\{\s*date:\s*'(\d{4}-\d{2}-\d{2})',\s*jours:\s*(\d+)/);
    if (apres) {
      const [, date, jours] = apres;
      const jour = Number(date.slice(8, 10));
      const mois = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][Number(date.slice(5, 7)) - 1];
      if (!new RegExp(`\\b${jours}\\b`).test(duree)) {
        visasIncoherents.push({ pays: m[1], motif: `la règle bascule à ${jours} jours le ${date}, mais ${jours} ne figure pas dans la phrase`, duree });
      } else if (!duree.includes(`${jour} ${mois}`)) {
        visasIncoherents.push({ pays: m[1], motif: `la bascule du ${jour} ${mois} n'est pas annoncée dans la phrase`, duree });
      }
    }
  }
}

/**
 * Tout tarif d'entrée publié doit être inscrit au registre des chiffres.
 *
 * La veille relit chaque nuit vingt-quatre portails officiels et cinquante
 * montants. Elle ne relisait aucun des tarifs de visa que ces portails fixent
 * : ils étaient publiés sur les fiches pays sans être déclarés nulle part. Les
 * 45 € chinois ont été corrigés à la main, et rien n'aurait signalé la
 * prochaine hausse — alors que c'est précisément le chiffre sur lequel un
 * voyageur fait son budget.
 *
 * Inscrire les treize tarifs existants ne suffisait pas : le quatorzième,
 * publié dans six mois, serait retombé dans le même trou. Ce contrôle ferme le
 * trou. Un montant peut être déclaré tarif officiel ou estimation assumée — il
 * ne peut pas n'être rien.
 */
const tarifsNonSuivis = [];
{
  const registre = readFileSync('src/data/chiffres-cites.ts', 'utf8');
  /**
   * Inscrit ET rattaché à la bonne page.
   *
   * Comparer les seuls nombres laissait le « 30 » du Laos satisfaire celui de
   * l'Indonésie : deux tarifs sans rapport, un contrôle content. On exige donc
   * que l'entrée du registre déclare la page du pays concerné — c'est ce qui
   * fait la différence entre un montant surveillé et un montant qui a la même
   * valeur qu'un autre.
   */
  const inscrits = new Map();
  for (const e of registre.matchAll(/affiche: '([^']+)'[\s\S]{0,400}?pages: \[([^\]]*)\]/g)) {
    const v = e[1].replace(/[  \u202f\u00a0]/g, '');
    if (!inscrits.has(v)) inscrits.set(v, new Set());
    for (const p of e[2].split(',')) {
      const brut = p.trim();
      if (!brut) continue;
      const litteral = brut.match(/^'([^']*)'$/)?.[1];
      // Une page déclarée via une constante : on résout sur sa valeur.
      const parConstante = litteral ?? registre.match(new RegExp(`^const ${brut} = '([^']+)';$`, 'm'))?.[1];
      if (parConstante) inscrits.get(v).add(parConstante);
    }
  }
  const ts = readFileSync('src/data/countries.ts', 'utf8');
  const DEVISES = /(\d[\d  \u202f\u00a0.,]*\d|\d)\s*(€|euros?|USD|dollars?|THB|bahts?|IDR|PHP|wons?|VND|dongs?|LAK|kips?|riels?)/g;

  for (const m of ts.matchAll(/slug: '([a-z-]+)'/g)) {
    const bloc = ts.slice(m.index, m.index + 8000);
    const i = bloc.indexOf('visa: {');
    if (i < 0) continue;
    const visa = bloc.slice(i, bloc.indexOf('\n    },', i));
    const cout = (visa.match(/cout:\s*"([^"]*)"/) ?? visa.match(/cout:\s*'([^']*)'/))?.[1] ?? '';
    for (const t of cout.matchAll(DEVISES)) {
      const brut = t[1].replace(/[  \u202f\u00a0]/g, '').trim();
      const page = `/${m[1]}`;
      const suivi = [brut, brut.replace('.', ','), brut.replace(',', '.')]
        .some((v) => inscrits.get(v)?.has(page));
      if (suivi) continue;
      tarifsNonSuivis.push({
        pays: m[1],
        montant: `${t[1].trim()} ${t[2]}`,
        motif: inscrits.has(brut) ? 'inscrit, mais pas pour cette page' : 'absent du registre',
      });
    }
  }
}

/**
 * Ce que le site présente aux machines doit dire la même chose que ses pages.
 *
 * `/llms.txt` et les fichiers de données existent pour être lus par un moteur
 * génératif qui rédigera une réponse à partir d'eux — et qui, contrairement à
 * un lecteur humain, ne rouvrira pas la fiche pour vérifier. Une durée périmée
 * là est plus grave qu'ailleurs : elle est reprise telle quelle, sans que
 * personne ne puisse la contredire.
 *
 * Trois exigences, et elles sont mécaniques : chaque pays a son fichier, le
 * lien depuis sa page y mène vraiment, et la durée annoncée dans `llms.txt`
 * est celle des données. Tout cela est généré depuis la même source — ces
 * contrôles ne préviennent donc pas une divergence de contenu, mais un
 * fichier absent, un lien mort ou un générateur cassé en silence.
 */
/**
 * Les passeports que le site déclare couvrir, lus dans les données plutôt
 * qu'écrits ici : le jour où un dixième passeport est ajouté, ce contrôle
 * l'exige des fichiers sans qu'on ait à s'en souvenir.
 */
const PASSEPORTS_ATTENDUS = [
  ...readFileSync('src/data/countries.ts', 'utf8').matchAll(/\{ code: '([a-z]{2})', nom:/g),
].map((m) => m[1]);

const defautsMachine = [];
if (existsSync('dist')) {
  const ts = readFileSync('src/data/countries.ts', 'utf8');
  const slugs = [...ts.matchAll(/slug: '([a-z-]+)'/g)].map((m) => m[1]);

  if (!existsSync('dist/llms.txt')) {
    defautsMachine.push({ quoi: '/llms.txt', motif: 'absent — les moteurs génératifs n\'ont rien à lire' });
  }
  const llms = existsSync('dist/llms.txt') ? readFileSync('dist/llms.txt', 'utf8') : '';

  for (const slug of slugs) {
    const fichier = `dist/donnees/${slug}.json`;
    if (!existsSync(fichier)) {
      defautsMachine.push({ quoi: `/donnees/${slug}.json`, motif: 'absent' });
      continue;
    }

    // Le lien depuis la page mène-t-il vraiment à ce fichier ?
    const page = `dist/${slug}/index.html`;
    if (existsSync(page)) {
      const html = readFileSync(page, 'utf8');
      if (!html.includes(`href="/donnees/${slug}.json"`)) {
        defautsMachine.push({ quoi: `/${slug}`, motif: 'ne déclare pas ses données lisibles par machine' });
      }
    }

    // La durée décidable est-elle celle du registre des pays ?
    const donnees = JSON.parse(readFileSync(fichier, 'utf8'));
    /**
     * Le bloc du pays s'arrête au pays suivant, pas au bout de 9000
     * caractères. Cette longueur arbitraire débordait sur la fiche d'après :
     * le Vietnam, qui n'a aucune règle datée, héritait de la bascule
     * thaïlandaise déclarée juste en dessous, et le contrôle réclamait une
     * annonce qui n'avait pas lieu d'être.
     */
    const debut = ts.indexOf(`slug: '${slug}'`);
    const suivant = ts.slice(debut + 1).search(/slug: '[a-z-]+'/);
    const bloc = ts.slice(debut, suivant < 0 ? undefined : debut + 1 + suivant);
    const attendu = Number(bloc.match(/sansVisaJours:\s*(\d+)/)?.[1] ?? NaN);
    const bascule = bloc.match(/sansVisaJoursApres:\s*\{\s*date:\s*'(\d{4}-\d{2}-\d{2})',\s*jours:\s*(\d+)/);
    const applicable = bascule && new Date().toISOString().slice(0, 10) >= bascule[1] ? Number(bascule[2]) : attendu;
    if (Number.isFinite(applicable) && donnees.visa?.joursSansVisa !== applicable) {
      defautsMachine.push({
        quoi: `/donnees/${slug}.json`,
        motif: `annonce ${donnees.visa?.joursSansVisa} jours sans visa là où la fiche en compte ${applicable}`,
      });
    }
    /**
     * Le compte à rebours et la nouvelle durée ne doivent jamais s'échanger.
     *
     * Une fiche dont la règle change porte deux nombres voisins : les jours qui
     * restent avant la bascule, et les jours de séjour qui s'appliqueront
     * ensuite. La première version du bandeau annonçait « 30 j » là où il
     * fallait lire « 9 j » et inversement — c'est-à-dire une durée de séjour
     * fausse, en haut de la page, sur la fiche la plus consultée du moment.
     * Rien ne l'aurait signalé : les deux nombres sont plausibles.
     */
    if (bascule && bascule[1] > new Date().toISOString().slice(0, 10) && existsSync(page)) {
      const texte = readFileSync(page, 'utf8').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const annonce = texte.match(/L'exemption passe de (\d+) à (\d+) jours/);
      if (!annonce) {
        defautsMachine.push({ quoi: `/${slug}`, motif: "la bascule à venir n'est pas annoncée en tête de page" });
      } else if (Number(annonce[1]) !== attendu || Number(annonce[2]) !== Number(bascule[2])) {
        defautsMachine.push({
          quoi: `/${slug}`,
          motif: `annonce « de ${annonce[1]} à ${annonce[2]} jours » là où la règle passe de ${attendu} à ${bascule[2]}`,
        });
      }
    }

    /**
     * Le fichier doit porter la règle de chaque passeport, relevée ou non.
     *
     * Il n'en connaissait qu'une : `joursSansVisa` figurait au premier niveau,
     * sans dire à quel passeport il appartenait. Une machine qui lisait ce
     * fichier pour répondre à « combien de jours au Vietnam » citait une durée
     * française comme si elle valait pour tout le monde — l'erreur même que ce
     * site existe pour empêcher, produite par le fichier qu'il publie pour
     * être cité.
     *
     * Un passeport dont la règle n'est pas relevée doit l'être quand même, en
     * le disant. Se taire sur lui le ferait passer pour un passeport sans
     * règle, ce qui est une réponse fausse et non un silence.
     */
    const par = donnees.visa?.parPasseport;
    if (!par) {
      defautsMachine.push({
        quoi: `/donnees/${slug}.json`,
        motif: "ne donne la règle que d'un passeport, sans dire lequel",
      });
    } else {
      for (const code of PASSEPORTS_ATTENDUS) {
        const r = par[code];
        if (!r) {
          defautsMachine.push({ quoi: `/donnees/${slug}.json`, motif: `ne dit rien du passeport ${code}` });
        } else if (r.releve && (typeof r.joursSansVisa !== 'number' || !r.source?.url || !r.verifieLe)) {
          defautsMachine.push({
            quoi: `/donnees/${slug}.json`,
            motif: `la règle ${code} est déclarée relevée mais sans durée, source ou date`,
          });
        } else if (!r.releve && !r.pourquoi) {
          defautsMachine.push({
            quoi: `/donnees/${slug}.json`,
            motif: `la règle ${code} manque, sans dire pourquoi`,
          });
        }
      }
    }

    if (llms && !llms.includes(`/${slug}.json`)) {
      defautsMachine.push({ quoi: '/llms.txt', motif: `ne mentionne pas ${slug}` });
    }
  }
}

if (defautsMachine.length) {
  console.log(`⛔ ${defautsMachine.length} défaut(s) sur ce que lisent les machines :\n`);
  for (const d of defautsMachine) console.log(`   ${d.quoi.padEnd(30)} ${d.motif}`);
  console.log('\n   Un moteur génératif reprend ces fichiers sans rouvrir la page.');
  console.log('   Ce qui est faux ici est repris tel quel, et personne ne le contredit.\n');
} else if (existsSync('dist')) {
  console.log('✓ Les fichiers lisibles par machine disent ce que disent les pages.\n');
}

/**
 * Un nom de pays ne s'écrit jamais tout nu dans une phrase française.
 *
 * Les pages de budget affichaient « Où se situe Japon », et leur titre H1
 * annonçait « Quel budget pour la Indonésie ». Deux fautes que personne ne
 * commet en écrivant à la main, produites par un gabarit qui déduisait
 * l'article du locatif ou l'omettait. Elles étaient en ligne sur neuf pages,
 * dans le titre que Google affiche — sur un site dont toute la promesse est
 * la précision.
 *
 * On relit donc ce que les gabarits produisent, à la recherche des formes
 * fautives connues. La liste est courte parce qu'elle vise des fautes réelles,
 * pas une grammaire complète : un contrôle qui tenterait de juger tout le
 * français crierait sans cesse et finirait ignoré.
 */
const fautesArticle = [];
if (existsSync('dist')) {
  const ts = readFileSync('src/data/countries.ts', 'utf8');
  const noms = [...ts.matchAll(/nom: '([^']+)'/g)].map((m) => m[1]);
  const voyelle = /^[AEIOUÉÈÀÎÔaeiouéèàîô]/;

  const pages = [];
  const parcourir = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) parcourir(p);
      else if (e.name === 'index.html') pages.push(p);
    }
  };
  parcourir('dist');

  for (const f of pages) {
    const url = f.replace(/^dist/, '').replace(/\/index\.html$/, '') || '/';
    const texte = readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#39;|&rsquo;/g, "'")
      .replace(/&nbsp;|&#160;/g, ' ')
      .replace(/\s+/g, ' ');

    for (const nom of noms) {
      // « la Indonésie », « le Indonésie » : élision manquée devant une voyelle.
      //
      // Le garde devant « la » n'est pas une précaution théorique : sans lui,
      // le contrôle lisait « laoevisa.gov.la Indonésie » dans un tableau — la
      // fin d'un nom de domaine suivie de la cellule voisine — et signalait
      // une faute qui n'existait pas. Un point est une frontière de mot.
      if (voyelle.test(nom) && new RegExp(`(?<![\\w.])[Ll]a ${nom}\\b`).test(texte)) {
        fautesArticle.push({ page: url, faute: `« la ${nom} » — élision manquée` });
      }
      // « Où se situe Japon » : le nom sans article après un verbe.
      const nu = new RegExp(`\\b(situe|situent|arrive|arrivent|coûte|coûtent) ${nom}\\b`);
      if (nu.test(texte)) {
        fautesArticle.push({ page: url, faute: `« ${texte.match(nu)[0]} » — article manquant` });
      }
    }
  }
}

if (fautesArticle.length) {
  const vues = new Set();
  const uniques = fautesArticle.filter((f) => !vues.has(f.faute + f.page) && vues.add(f.faute + f.page));
  console.log(`⛔ ${uniques.length} faute(s) d'article sur des pages produites :\n`);
  for (const f of uniques.slice(0, 12)) console.log(`   ${f.page.padEnd(28)} ${f.faute}`);
  console.log('\n   Un gabarit qui écrit un nom de pays sans article se voit immédiatement,');
  console.log('   et il se voit dans le titre que Google affiche.\n');
} else if (existsSync('dist')) {
  console.log("✓ Aucun nom de pays écrit sans son article.\n");
}

/**
 * Les règles des autres passeports.
 *
 * Une règle d'entrée vaut pour un passeport, pas dans l'absolu : « 45 jours
 * sans visa au Vietnam » est vrai pour un Français et faux pour un Canadien,
 * qui a besoin d'un visa dès le premier jour. Le modèle porte donc une règle
 * par passeport, et chacune doit tenir debout seule.
 *
 * Trois exigences, et chacune répare une faute déjà commise ailleurs dans ce
 * dépôt :
 *
 *   — Pas d'entrée `fr` dans `regles`. La règle française vit dans `visa`, où
 *     vingt pages la lisent. La dupliquer créerait deux sources de vérité pour
 *     la même règle, et elles divergeraient — c'est arrivé sur la description
 *     des fiches pays.
 *
 *   — Une source et une date par règle. Deux pays ne publient pas au même
 *     rythme : une date unique pour six règles mentirait sur cinq d'entre elles.
 *
 *   — Le nombre doit figurer dans la phrase. C'est le contrôle qui existe déjà
 *     pour la règle française : si l'une bouge sans l'autre, l'outil et le
 *     texte se contredisent, et c'est l'outil qu'on croit.
 */
const reglesIncoherentes = [];
{
  const ts = readFileSync('src/data/countries.ts', 'utf8');
  for (const m of ts.matchAll(/slug: '([a-z-]+)'/g)) {
    const debut = m.index;
    const suivant = ts.slice(debut + 1).search(/slug: '[a-z-]+'/);
    const bloc = ts.slice(debut, suivant < 0 ? undefined : debut + 1 + suivant);
    const i = bloc.indexOf('regles: {');
    if (i < 0) continue;
    const seg = bloc.slice(i, bloc.indexOf('\n      },', i));

    if (/^\s*fr:\s*\{/m.test(seg)) {
      reglesIncoherentes.push({ pays: m[1], passeport: 'fr', motif: "la règle française vit dans `visa`, jamais dans `regles`" });
    }

    for (const r of seg.matchAll(/^\s{8}([a-z]{2}): \{([\s\S]*?)\n\s{8}\},/gm)) {
      const [, code, corps] = r;
      const jours = Number(corps.match(/sansVisaJours:\s*(\d+)/)?.[1] ?? NaN);
      // Le résumé porte les deux langues depuis que les pages anglaises
      // existent. Les deux doivent annoncer le même nombre : une page qui dit
      // « Visa required » au-dessus de « 45 jours sans visa » se contredit
      // elle-même, et c'est l'anglaise qu'un anglophone croira.
      const resumeFr = corps.match(/resume:\s*\{\s*fr:\s*"((?:[^"\\]|\\.)*)"/)?.[1] ?? '';
      const resumeEn = corps.match(/en:\s*"((?:[^"\\]|\\.)*)"\s*\}/)?.[1] ?? '';
      const resume = resumeFr;
      const url = corps.match(/url:\s*'([^']+)'/)?.[1] ?? '';
      const date = corps.match(/verifieLe:\s*'(\d{4}-\d{2})'/)?.[1] ?? '';

      if (!Number.isFinite(jours)) reglesIncoherentes.push({ pays: m[1], passeport: code, motif: 'sansVisaJours absent' });
      if (!url) reglesIncoherentes.push({ pays: m[1], passeport: code, motif: 'aucune source officielle' });
      if (!date) reglesIncoherentes.push({ pays: m[1], passeport: code, motif: 'aucune date de relevé' });
      if (Number.isFinite(jours) && jours > 0 && !new RegExp(`\\b${jours}\\b`).test(resume)) {
        reglesIncoherentes.push({ pays: m[1], passeport: code, motif: `${jours} ne figure pas dans la phrase`, resume });
      }
      if (Number.isFinite(jours) && jours === 0 && !/visa obligatoire/i.test(resume)) {
        reglesIncoherentes.push({ pays: m[1], passeport: code, motif: "annoncé à 0 sans que la phrase dise « visa obligatoire »", resume });
      }
      if (!resumeEn) {
        reglesIncoherentes.push({ pays: m[1], passeport: code, motif: 'aucun résumé en anglais' });
      } else if (Number.isFinite(jours) && jours > 0 && !new RegExp(`\\b${jours}\\b`).test(resumeEn)) {
        reglesIncoherentes.push({ pays: m[1], passeport: code, motif: `${jours} ne figure pas dans la phrase anglaise`, resume: resumeEn });
      } else if (Number.isFinite(jours) && jours === 0 && !/visa required/i.test(resumeEn)) {
        reglesIncoherentes.push({ pays: m[1], passeport: code, motif: "annoncé à 0 sans que la phrase anglaise dise « visa required »", resume: resumeEn });
      }

      const ap = corps.match(/sansVisaJoursApres:\s*\{\s*date:\s*'(\d{4}-\d{2}-\d{2})',\s*jours:\s*(\d+)/);
      if (ap && !new RegExp(`\\b${ap[2]}\\b`).test(resume)) {
        reglesIncoherentes.push({ pays: m[1], passeport: code, motif: `bascule à ${ap[2]} jours non annoncée dans la phrase`, resume });
      }
    }
  }
}

if (reglesIncoherentes.length) {
  console.log(`⛔ ${reglesIncoherentes.length} règle(s) d'entrée par passeport mal formée(s) :\n`);
  for (const r of reglesIncoherentes) {
    console.log(`   ${r.pays.padEnd(14)} ${r.passeport.toUpperCase()}  ${r.motif}`);
    if (r.resume) console.log(`      « ${r.resume.slice(0, 80)}… »`);
  }
  console.log('\n   Une règle d\'entrée vaut pour un passeport, pas dans l\'absolu.');
  console.log('   Sans source ni date, elle ne vaut pour personne.\n');
} else {
  console.log("✓ Chaque règle par passeport porte sa source, sa date et son chiffre.\n");
}

/**
 * Les deux versions d'une page doivent exister, et se déclarer l'une l'autre.
 *
 * `hreflang` dit à Google « cette page existe aussi là ». Une balise vers une
 * page absente est pire que pas de balise : Google va la chercher, trouve un
 * 404, et cesse de croire les autres. Une déclaration à sens unique est presque
 * aussi mauvaise — Google exige la réciprocité et ignore les paires boiteuses.
 *
 * Ce contrôle est le prix du bilingue. Sans lui, la première page traduite à
 * moitié ferait promettre au site une version anglaise qui n'existe pas, et
 * personne ne s'en apercevrait avant des mois.
 */
const defautsLangue = [];
if (existsSync('dist')) {
  const pages = [];
  const parcourir = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) parcourir(p);
      else if (e.name === 'index.html') pages.push(p);
    }
  };
  parcourir('dist');

  const existe = new Set(pages.map((f) => f.replace(/^dist/, '').replace(/\/index\.html$/, '') || '/'));
  const declare = new Map();

  for (const f of pages) {
    const url = f.replace(/^dist/, '').replace(/\/index\.html$/, '') || '/';
    const html = readFileSync(f, 'utf8');
    const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
      .filter((m) => m[1] !== 'x-default')
      .map((m) => new URL(m[2]).pathname.replace(/\/$/, '') || '/');
    if (!alts.length) continue;
    declare.set(url, alts);

    for (const cible of alts) {
      if (!existe.has(cible)) {
        defautsLangue.push({ page: url, motif: `déclare une version à ${cible}, qui n'existe pas` });
      }
    }
  }

  // La réciprocité : si A dit que B est sa traduction, B doit le dire aussi.
  for (const [url, alts] of declare) {
    for (const cible of alts) {
      if (cible === url) continue;
      const retour = declare.get(cible);
      if (retour && !retour.includes(url)) {
        defautsLangue.push({ page: url, motif: `déclare ${cible}, qui ne le déclare pas en retour` });
      } else if (!retour && existe.has(cible)) {
        defautsLangue.push({ page: cible, motif: `est déclarée comme traduction de ${url} mais ne déclare rien` });
      }
    }
  }
}

if (defautsLangue.length) {
  const vus = new Set();
  const uniques = defautsLangue.filter((d) => !vus.has(d.page + d.motif) && vus.add(d.page + d.motif));
  console.log(`⛔ ${uniques.length} défaut(s) dans les liens entre les deux langues :\n`);
  for (const d of uniques.slice(0, 12)) console.log(`   ${d.page.padEnd(28)} ${d.motif}`);
  console.log('\n   Une balise hreflang vers une page absente est pire que pas de balise :');
  console.log('   Google la suit, trouve un 404, et doute des autres.\n');
} else if (existsSync('dist')) {
  console.log('✓ Les deux versions se déclarent correctement l\'une l\'autre.\n');
}

/**
 * Aucun formulaire d'inscription sur une page anglaise.
 *
 * La lettre est écrite en français, et la liste qui la reçoit l'est aussi —
 * jusqu'au `locale=fr` qui fixe la langue des messages d'erreur du
 * prestataire. Recueillir une adresse anglophone sur cette promesse revient à
 * promettre une lettre que la personne ne pourra pas lire.
 *
 * Le pied de page anglais l'avait décidé dès le premier jour et l'avait écrit.
 * Deux mécanismes l'ignoraient quand même : le bloc de capture des outils, que
 * j'ai posé sur la page anglaise en traduisant trois phrases sur six, et la
 * pop-up de sortie, qui n'était accrochée à aucune langue et surgissait en
 * français sur les neuf fiches anglaises. Une décision qui ne vit que dans la
 * mémoire de celui qui l'a prise n'est pas une décision, c'est un souvenir.
 *
 * Le contrôle lèvera le jour où une liste anglaise existera — et c'est
 * précisément à ce moment-là qu'il faut relire cette page, pas avant.
 */
const formulairesEnAnglais = [];
if (existsSync('dist/en')) {
  const pagesEn = [];
  const parcourirForm = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) parcourirForm(p);
      else if (e.name === 'index.html') pagesEn.push(p);
    }
  };
  parcourirForm('dist/en');

  for (const f of pagesEn) {
    const html = readFileSync(f, 'utf8');
    if (/<form[^>]*class="[^"]*au-nl\b/.test(html) || /name="locale" value="fr"/.test(html)) {
      formulairesEnAnglais.push(f.replace(/^dist/, '').replace(/\/index\.html$/, ''));
    }
  }
}

if (formulairesEnAnglais.length) {
  console.log(`⛔ ${formulairesEnAnglais.length} page(s) anglaise(s) proposent la lettre française :\n`);
  for (const p of formulairesEnAnglais.slice(0, 12)) console.log(`   ${p}`);
  console.log('\n   La lettre est en français et la liste aussi. Recueillir une adresse');
  console.log("   là-dessus, c'est promettre ce qu'on ne peut pas tenir.\n");
} else if (existsSync('dist/en')) {
  console.log("✓ Aucune page anglaise ne propose une lettre qu'elle ne peut pas envoyer.\n");
}

/**
 * Un lien vers une page française, depuis une page anglaise, doit le dire.
 *
 * Le site en propose délibérément — « lire cette fiche en français », le
 * journal des corrections avant qu'il existe en anglais. Ils sont utiles. Ce
 * qui ne l'est pas, c'est qu'ils ressemblent aux autres : un lecteur
 * anglophone clique, arrive sur une page qu'il ne lit pas, et conclut que la
 * version anglaise est un décor posé sur un site français.
 *
 * `lang="fr"` le dit au lecteur — le navigateur et les lecteurs d'écran
 * changent de voix — et à ce contrôle. La convention existait déjà dans le
 * pied de page ; elle n'était nulle part vérifiée, et dix liens l'ignoraient.
 *
 * Les cibles sans langue sont exclues : les données ouvertes, `llms.txt`, les
 * images, les fichiers statiques. Un JSON ne se lit pas dans une langue.
 */
const liensNonMarques = [];
if (existsSync('dist/en')) {
  const NEUTRES = /^\/(donnees|og|brand|favicon|telechargements|_astro|pagefind|llms)/;
  const pagesEn = [];
  const parcourirEn = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) parcourirEn(p);
      else if (e.name === 'index.html') pagesEn.push(p);
    }
  };
  parcourirEn('dist/en');

  for (const f of pagesEn) {
    const url = f.replace(/^dist/, '').replace(/\/index\.html$/, '');
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/<a\b([^>]*)>/g)) {
      const attrs = m[1];
      const href = attrs.match(/href="([^"]*)"/)?.[1];
      if (!href || !href.startsWith('/')) continue;
      if (href === '/en' || href.startsWith('/en/')) continue;
      if (NEUTRES.test(href)) continue;
      if (/lang="fr"/.test(attrs)) continue;
      liensNonMarques.push({ page: url, cible: href });
    }
  }
}

if (liensNonMarques.length) {
  const vus = new Set();
  const uniques = liensNonMarques.filter((l) => !vus.has(l.page + l.cible) && vus.add(l.page + l.cible));
  console.log(`⛔ ${uniques.length} lien(s) vers une page française sans le dire :\n`);
  for (const l of uniques.slice(0, 12)) console.log(`   ${l.page.padEnd(32)} → ${l.cible}`);
  console.log('\n   Ajoutez hreflang="fr" lang="fr" : le lecteur sait où il va, et le');
  console.log('   lecteur d\'écran change de voix au lieu de lire du français à l\'anglaise.\n');
} else if (existsSync('dist/en')) {
  console.log('✓ Chaque lien anglais vers une page française annonce sa langue.\n');
}

/**
 * Le journal anglais ne doit pas prendre de retard sur le français.
 *
 * La page anglaise affiche « {n} corrections published » et les liste toutes.
 * Si une correction française n'a pas sa traduction, la page plante à la
 * compilation — ce qui est déjà un filet. Mais l'inverse est silencieux : une
 * traduction laissée pour une correction supprimée, ou une clé qui ne
 * correspond plus à aucune ancre, laisse un texte orphelin que personne ne
 * voit et que personne ne relit.
 *
 * Surtout, ce contrôle dit la faute au bon moment. Sans lui, elle apparaît à
 * la compilation sous la forme d'une erreur de propriété indéfinie, à charge
 * pour celui qui la lit de comprendre qu'il manque une traduction.
 */
const journalEnRetard = [];
{
  const fr = readFileSync('src/data/corrections.ts', 'utf8');
  const entrees = [...fr.matchAll(/date: '([\d-]+)',\s*\n\s*page: '([^']+)'/g)].map(
    (m) => ({ date: m[1], page: m[2] }),
  );
  const vus = new Map();
  const ancres = entrees.map((e) => {
    const base = `c-${e.date}-${e.page.replace(/^\//, '').replace(/\//g, '-') || 'accueil'}`;
    const rang = (vus.get(base) ?? 0) + 1;
    vus.set(base, rang);
    return rang === 1 ? base : `${base}-${rang}`;
  });

  if (existsSync('src/data/corrections.en.ts')) {
    const en = readFileSync('src/data/corrections.en.ts', 'utf8');
    const clesEn = [...en.matchAll(/^  '([^']+)': \{$/gm)].map((m) => m[1]);
    for (const a of ancres) {
      if (!clesEn.includes(a)) journalEnRetard.push(`${a} n'a pas de version anglaise`);
    }
    for (const c of clesEn) {
      if (!ancres.includes(c)) journalEnRetard.push(`${c} est traduite mais ne correspond à aucune correction`);
    }
  }

  /* Deux corrections ne doivent jamais partager une ancre : l'identifiant HTML
     serait en double, et le lien mènerait toujours à la première. C'est arrivé
     deux fois — la fiche Thaïlande corrigée deux fois dans la même journée. */
  const doublons = ancres.filter((a, i) => ancres.indexOf(a) !== i);
  for (const d of new Set(doublons)) journalEnRetard.push(`l'ancre ${d} est en double`);
}

if (journalEnRetard.length) {
  console.log(`⛔ ${journalEnRetard.length} défaut(s) dans le journal des corrections :\n`);
  for (const d of journalEnRetard) console.log(`   ${d}`);
  console.log('\n   La page anglaise annonce un journal complet et les liste toutes.');
  console.log("   Une entrée manquante en fait un journal partiel présenté comme entier.\n");
} else if (existsSync('src/data/corrections.en.ts')) {
  console.log('✓ Le journal des corrections dit la même chose dans les deux langues.\n');
}

/**
 * Le fichier lu par les modèles doit dire qu'il existe une version anglaise.
 *
 * `llms.txt` existe pour une seule raison : un moteur génératif qui doit
 * trancher entre dix guides contradictoires n'a souvent que lui pour savoir
 * d'où vient une règle et de quand elle date. Tant qu'il annonçait un site
 * « pour des lecteurs francophones », un modèle cherchant une règle d'entrée
 * en anglais lisait cette phrase et passait à un autre site — alors que la
 * réponse existait, avec sa source et sa date, à un préfixe d'URL de là.
 *
 * Le défaut ne casse rien et ne se voit nulle part : le fichier est exact sur
 * tout ce qu'il dit, il est seulement muet sur la moitié du site.
 */
const llmsMuet = [];
if (existsSync('dist/llms.txt') && existsSync('dist/en')) {
  const llms = readFileSync('dist/llms.txt', 'utf8');
  const pagesEn = readdirSync('dist/en', { withFileTypes: true })
    .filter((e) => e.isDirectory()).length;
  if (pagesEn > 0 && !llms.includes('/en/')) {
    llmsMuet.push(`${pagesEn} section(s) anglaise(s) servie(s), et llms.txt n'en cite aucune`);
  }
}

if (llmsMuet.length) {
  console.log('⛔ Le fichier lu par les modèles ignore la version anglaise :\n');
  for (const m of llmsMuet) console.log(`   ${m}`);
  console.log('\n   Un modèle qui cherche une règle en anglais lit « pour des lecteurs');
  console.log('   francophones » et va voir ailleurs, alors que la réponse est là.\n');
} else if (existsSync('dist/llms.txt')) {
  console.log('✓ Le fichier lu par les modèles annonce ce que le site sert.\n');
}

/**
 * Une paire traduite qui ne se déclare pas du tout.
 *
 * Le contrôle précédent vérifie la réciprocité de ce qui est déclaré. Il ne
 * dit rien du cas où les deux versions existent et où *aucune* ne parle de
 * l'autre — et c'est précisément ce qui s'est produit : vingt-deux articles
 * anglais, chacun correct, reliés à leur original par `traduitDe`, et pas une
 * balise `hreflang` entre eux. Rien ne clochait à l'écran, rien ne clochait au
 * contrôle : une paire muette ne promet rien, donc ne se contredit jamais.
 *
 * Pour Google, deux pages étrangères l'une à l'autre qui traitent le même
 * sujet ne sont pas une traduction — ce sont deux candidates. C'est ainsi
 * qu'une version anglaise se met à concurrencer son original au lieu de le
 * compléter, et le symptôme (une page qui perd son classement) apparaît des
 * mois après la cause.
 *
 * Ce contrôle part donc de `traduitDe`, pas du HTML : si les deux pages sont
 * parues, elles doivent se nommer l'une l'autre.
 */
const paires = [];
if (existsSync('dist')) {
  const aujourdhui = new Date().toISOString().slice(0, 10);
  for (const { dossier, prefixe, traduitDe } of TRADUITES) {
    if (!existsSync(dossier)) continue;
    for (const f of readdirSync(dossier)) {
      if (!f.endsWith('.md')) continue;
      const contenu = readFileSync(`${dossier}/${f}`, 'utf8');
      const origine = contenu.match(/^traduitDe:\s*(\S+)\s*$/m)?.[1];
      const date = contenu.match(/^pubDate:\s*(\S+)\s*$/m)?.[1];
      if (!origine || !date || date > aujourdhui) continue;
      paires.push({ en: `${prefixe}${f.replace(/\.md$/, '')}`, fr: `${PREFIXES[traduitDe]}${origine}` });
    }
  }
}

/**
 * Un `traduitDe` qui ne désigne aucun article français.
 *
 * Le contrôle qui suit travaille sur `dist`, donc uniquement sur ce qui est
 * paru. Un article anglais programmé pour dans deux mois peut donc porter un
 * slug d'origine erroné pendant deux mois sans que rien ne le dise — et le
 * jour de sa parution, il déclare une jumelle inexistante, son bouton de
 * langue renvoie sur un 404, et le défaut arrive en ligne au lieu d'arriver
 * ici. Celui-ci lit les fichiers, pas les pages : il voit la faute le jour où
 * elle est écrite.
 */
const originesFantomes = [];
for (const { dossier, prefixe, traduitDe } of TRADUITES) {
  for (const f of existsSync(dossier) ? readdirSync(dossier) : []) {
    if (!f.endsWith('.md')) continue;
    const origine = readFileSync(`${dossier}/${f}`, 'utf8').match(/^traduitDe:\s*(\S+)\s*$/m)?.[1];
    if (origine && !existsSync(`${traduitDe}/${origine}.md`)) {
      originesFantomes.push({ page: `${prefixe}${f.replace(/\.md$/, '')}`, origine });
    }
  }
}

if (originesFantomes.length) {
  console.log(`⛔ ${originesFantomes.length} article(s) anglais citent un original qui n'existe pas :\n`);
  for (const o of originesFantomes) console.log(`   ${o.page.padEnd(40)} traduitDe: ${o.origine}`);
  console.log('\n   Le jour de la parution, la page déclarera une jumelle absente et son');
  console.log('   bouton de langue renverra sur un 404.\n');
} else if (existsSync('src/content/blog-en')) {
  console.log("✓ Chaque article anglais désigne un original qui existe.\n");
}

const muettes = [];
for (const { en, fr } of paires) {
  for (const [page, attendu] of [[en, fr], [fr, en]]) {
    const fichier = `dist${page}/index.html`;
    if (!existsSync(fichier)) {
      muettes.push({ page, motif: `n'a pas été construite, alors que sa jumelle ${attendu} l'a été` });
      continue;
    }
    /* On lit les balises, pas la page : l'article anglais porte déjà un lien
       visible « Lire cet article en français », avec son attribut `hreflang`.
       Chercher la chaîne dans le HTML entier aurait donc validé une page qui
       ne déclare rien — le contrôle aurait passé au vert sur le défaut même
       qu'il est là pour voir. */
    const balises = [...readFileSync(fichier, 'utf8')
      .matchAll(/<link rel="alternate" hreflang="[^"]+" href="([^"]+)"/g)]
      .map((m) => new URL(m[1]).pathname.replace(/\/$/, ''));
    if (!balises.includes(attendu)) {
      muettes.push({ page, motif: `ne déclare pas sa traduction ${attendu}` });
    }
  }
}

if (muettes.length) {
  console.log(`⛔ ${muettes.length} page(s) traduite(s) ne le disent pas :\n`);
  for (const m of muettes.slice(0, 12)) console.log(`   ${m.page.padEnd(40)} ${m.motif}`);
  console.log('\n   Deux pages qui traitent le même sujet sans se déclarer ne sont pas');
  console.log('   une traduction pour Google : ce sont deux candidates.\n');
} else if (paires.length) {
  console.log(`✓ Les ${paires.length} paire(s) d'articles traduits se nomment l'une l'autre.\n`);
}

/**
 * Du français resté sur une page anglaise.
 *
 * Une page à moitié traduite se repère en deux secondes, et elle fait douter
 * du reste — y compris des chiffres, qui sont justes. C'est arrivé dès la
 * première fournée : le titre affichait « Visa required » et la phrase juste
 * en dessous « Visa obligatoire. E-visa touristique… », parce que la règle
 * n'existait qu'en français dans les données.
 *
 * On ne juge pas le français : on cherche les tournures que ce site produit,
 * celles qui trahissent une donnée ou un gabarit non traduit. Une liste courte
 * de motifs réels vaut mieux qu'un détecteur de langue qui crierait sur le
 * bouton « Français » — lequel est là exprès.
 */
const francaisEnAnglais = [];
if (existsSync('dist/en')) {
  const MOTIFS = [
    /Selon votre passeport/, /Relevé en /, /Visa obligatoire/, /jours sans visa/,
    /Nous n'avons pas relevé/, /Dès \d+ €\/jour/, /Meilleurs mois/, /Formalités vérifiées/,
    // Les noms de passeports : le premier contrôle les a laissés passer, et
    // c'est l'œil qui les a vus — « Royaume-Uni », « États-Unis » dans un
    // sélecteur anglais. Un contrôle qui ne cherche que ce qu'on a déjà trouvé
    // ne trouve jamais rien de nouveau, mais il empêche au moins le retour.
    /Royaume-Uni/, /États-Unis/, /Nouvelle-Zélande/, /Australie\b/,
    // Une date en français. Le défaut ne vient pas d'un texte oublié mais d'un
    // composant : la carte d'article formatait en `fr-FR` en dur, ce qui était
    // juste tant qu'elle ne servait qu'au site français. Réutilisée sur la
    // liste anglaise, elle a écrit « 1 septembre 2026 » sous des titres
    // anglais — et les motifs ci-dessus, qui cherchent des phrases du site,
    // l'ont laissée passer. Un gabarit non traduit ne ressemble pas à une
    // phrase non traduite.
    /\b\d{1,2} (?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) \d{4}\b/,
    // Un décalage horaire relatif à la France. Il ne disait pas seulement le
    // français : il donnait une information fausse pour tout autre lecteur
    // qu'un Français — un Britannique est à une heure de Paris, un Californien
    // à neuf. Traduire la phrase l'aurait rendue fausse plutôt que française.
    /\+\d h (?:en été|à \+\d h selon)/,
  ];
  const pages = [];
  const parcourir = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = `${d}/${e.name}`;
      if (e.isDirectory()) parcourir(p);
      else if (e.name === 'index.html') pages.push(p);
    }
  };
  parcourir('dist/en');

  for (const f of pages) {
    const url = f.replace(/^dist/, '').replace(/\/index\.html$/, '');
    // Les liens vers la version française portent lang="fr" : ils sont voulus.
    const texte = readFileSync(f, 'utf8')
      .replace(/<script[\s\S]*?<\/script>/g, ' ')
      .replace(/<a[^>]+lang="fr"[^>]*>[\s\S]*?<\/a>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#39;|&rsquo;/g, "'")
      .replace(/\s+/g, ' ');
    for (const m of MOTIFS) {
      const trouve = texte.match(m);
      if (trouve) francaisEnAnglais.push({ page: url, extrait: trouve[0] });
    }
  }
}

if (francaisEnAnglais.length) {
  const vus = new Set();
  const uniques = francaisEnAnglais.filter((f) => !vus.has(f.page + f.extrait) && vus.add(f.page + f.extrait));
  console.log(`⛔ ${uniques.length} morceau(x) de français sur des pages anglaises :\n`);
  for (const f of uniques.slice(0, 12)) console.log(`   ${f.page.padEnd(24)} « ${f.extrait} »`);
  console.log('\n   Une page à moitié traduite fait douter de ses chiffres, qui sont justes.');
  console.log('   Cherchez la donnée ou le gabarit qui n\'existe que dans une langue.\n');
} else if (existsSync('dist/en')) {
  console.log('✓ Aucune page anglaise ne laisse traîner du français.\n');
}

/**
 * Chaque texte doit avoir un verdict de traduction.
 *
 * Tous ne se traduisent pas : un comparatif d'assurances françaises rendu en
 * anglais est irréprochable et parfaitement inutile, puisque ces contrats ne
 * sont pas vendus au lecteur. La distinction est écrite dans
 * `src/data/traduction.ts`, avec sa raison.
 *
 * Sans ce contrôle, un article écrit dans six mois n'y figurerait pas, et
 * personne ne saurait s'il attend d'être traduit ou s'il ne doit pas l'être.
 * Le classement deviendrait un document d'archive plutôt qu'une décision.
 */
const nonClasses = [];
{
  const ts = readFileSync('src/data/traduction.ts', 'utf8');
  const classes = new Set(
    [...ts.matchAll(/\{ slug: '([^']+)', collection: '([^']+)'/g)].map((m) => `${m[2]}/${m[1]}`),
  );
  for (const dossier of ['blog', 'guides']) {
    const chemin = `src/content/${dossier}`;
    if (!existsSync(chemin)) continue;
    for (const f of readdirSync(chemin).filter((f) => f.endsWith('.md') && !f.startsWith('_'))) {
      const slug = f.replace(/\.md$/, '');
      if (!classes.has(`${dossier}/${slug}`)) nonClasses.push(`${dossier}/${slug}`);
    }
  }
}

if (nonClasses.length) {
  console.log(`⛔ ${nonClasses.length} texte(s) sans verdict de traduction :\n`);
  for (const t of nonClasses) console.log(`   ${t}`);
  console.log('\n   Inscrivez-le dans src/data/traduction.ts : « traduire » s\'il reste vrai');
  console.log('   en anglais, « reecrire » s\'il demanderait d\'autres sources, « sans-objet »');
  console.log('   si la règle par passeport le remplace. Avec la raison, en une phrase.\n');
} else {
  console.log('✓ Chaque texte porte un verdict de traduction.\n');
}

if (!tarifsNonSuivis.length) console.log("✓ Chaque tarif d'entrée publié est inscrit au registre.\n");

if (tarifsNonSuivis.length) {
  console.log(`⛔ ${tarifsNonSuivis.length} tarif(s) d'entrée publiés sans être surveillés :\n`);
  for (const t of tarifsNonSuivis) console.log(`   ${t.pays.padEnd(14)} ${t.montant.padEnd(14)} — ${t.motif}`);
  console.log('\n   Un tarif de visa absent du registre ne sera relu par personne :');
  console.log('   il restera affiché tel quel le jour où le consulat l\'augmentera.');
  console.log('   Inscrivez-le dans src/data/chiffres-cites.ts — comme tarif officiel');
  console.log('   avec sa source, ou comme estimation assumée avec sa raison.\n');
}

if (visasIncoherents.length) {
  console.log(`⛔ ${visasIncoherents.length} règle(s) de visa où le chiffre et la phrase divergent :\n`);
  for (const v of visasIncoherents) {
    console.log(`   ${v.pays} — ${v.motif}`);
    if (v.duree) console.log(`      « ${v.duree.slice(0, 90)}… »`);
  }
  console.log('\n   L\'outil « Puis-je entrer ? » répondrait à partir du chiffre.');
  console.log('   Une divergence ici autorise un séjour que la règle interdit.\n');
} else {
  console.log('✓ Chaque durée d\'exemption chiffrée correspond à sa phrase.\n');
}

/* ── Une correction publiée a-t-elle vraiment été faite ? ────────── */

/**
 * Le journal des corrections affirme, pour chaque entrée, « le site disait
 * ceci, la source dit cela ». C'est la page la plus exigeante du site : elle
 * ne décrit pas une intention, elle atteste d'un fait accompli.
 *
 * Rien ne le vérifiait. Le 3 septembre 2026, une correction annonçant que
 * l'exemption thaïlandaise passait de soixante à trente jours a été publiée
 * pendant que la fiche pays affichait toujours l'ancienne règle — un script
 * avait échoué sur une assertion après avoir modifié le texte en mémoire,
 * sans jamais écrire le fichier. Le site se félicitait donc d'une correction
 * qu'il n'avait pas appliquée, sur sa page de confiance.
 *
 * Le contrôle est simple et il aurait suffi : si le texte cité comme « avant »
 * figure encore sur la page concernée, la correction n'a pas eu lieu.
 *
 * Les `avant` qui ne sont pas des phrases de la page — une adresse remplacée,
 * une source retirée — ne déclenchent naturellement rien, puisqu'ils n'y
 * figuraient pas non plus auparavant.
 */
const correctionsNonFaites = [];
if (existsSync('dist')) {
  const ts = readFileSync('src/data/corrections.ts', 'utf8');
  const propre = (t) =>
    t.replace(/\s+/g, ' ').replace(/[«»""'']/g, "'").trim();

  for (const m of ts.matchAll(/page: '([^']+)',[\s\S]{0,400}?avant:\s*\n?\s*"([^"]+)"/g)) {
    const page = m[1];
    const avant = propre(m[2]);
    // Trop court pour être discriminant : un fragment de trois mots se
    // retrouve partout et produirait de fausses alertes.
    if (avant.length < 40) continue;

    const f = `dist${page}/index.html`;
    if (!existsSync(f)) continue;
    const texte = propre(readFileSync(f, 'utf8').replace(/<[^>]+>/g, ' ').replace(/&#39;|&rsquo;/g, "'"));
    if (texte.includes(avant)) correctionsNonFaites.push({ page, avant });
  }
}

if (correctionsNonFaites.length) {
  console.log(`⛔ ${correctionsNonFaites.length} correction(s) publiée(s) mais pas appliquée(s) :\n`);
  for (const c of correctionsNonFaites) {
    console.log(`   ${c.page}`);
    console.log(`   le texte cité comme « avant » figure encore sur la page :`);
    console.log(`   « ${c.avant.slice(0, 100)}… »\n`);
  }
  console.log('   Le journal des corrections atteste de faits accomplis, pas');
  console.log('   d\'intentions. Publier une correction non faite est la seule');
  console.log('   chose que cette page ne peut pas se permettre.\n');
} else if (existsSync('dist')) {
  console.log('✓ Chaque correction publiée est appliquée sur sa page.\n');
}

process.exit(
  jamaisEcrits.length || jamaisLus.length || defautsFormulaire.length ||
  ecartSources || visasIncoherents.length || correctionsNonFaites.length ||
  tarifsNonSuivis.length || defautsMachine.length || fautesArticle.length ||
  reglesIncoherentes.length || defautsLangue.length || francaisEnAnglais.length ||
  nonClasses.length || muettes.length || originesFantomes.length ||
  llmsMuet.length || journalEnRetard.length || liensNonMarques.length ||
  formulairesEnAnglais.length ? 1 : 0,
);
