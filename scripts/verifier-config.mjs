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

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

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
  tarifsNonSuivis.length || defautsMachine.length ? 1 : 0,
);
