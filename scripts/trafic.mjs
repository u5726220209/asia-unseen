#!/usr/bin/env node
/**
 * La sentinelle de trafic.
 *
 * C'est le seul garde-fou qui regarde à l'extérieur, et le plus important des
 * huit — parce que le risque qu'il surveille est le seul qui puisse tuer le
 * site d'un coup.
 *
 * Un site qui publie sans relecture humaine peut être classé par Google comme
 * production de masse. La sanction n'arrive pas par courrier : les pages
 * sortent de l'index, les impressions s'effondrent, et rien sur le site ne
 * change — il répond parfaitement, il n'a simplement plus de visiteurs. Sans
 * ce contrôle, on s'en aperçoit à la baisse des revenus, des mois plus tard.
 *
 * Il compare donc chaque semaine les impressions et les pages indexées aux
 * quatre semaines précédentes. Une chute franche déclenche l'alerte, et la
 * première chose à faire est de couper la rédaction automatique dans
 * src/data/redaction.ts, avant même de comprendre.
 *
 * ── Mise en route ── (faite le 31 août 2026)
 * Projet Google Cloud « asia-unseen-veille », API Search Console activée,
 * compte de service sentinelle-trafic@asia-unseen-veille.iam.gserviceaccount.com
 * ajouté en accès limité sur la propriété, clé déposée en secret GSC_CLE_JSON.
 *
 * Pour refaire la chaîne ailleurs : créer le projet, activer l'API, créer le
 * compte de service et sa clé JSON, ajouter son adresse dans Search Console →
 * Paramètres → Utilisateurs, puis coller la clé en secret GSC_CLE_JSON. Sans
 * le secret, ce script le dit et s'arrête sans rien bloquer.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DOMAINE = (process.env.SITE_URL || 'https://asiaunseen.com')
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '');
const ETAT = 'src/data/trafic-historique.json';

/** Au-delà, la baisse ne s'explique plus par la saisonnalité. */
const CHUTE_ALERTE = 0.5;   // moitié moins d'impressions
const CHUTE_GRAVE = 0.7;    // effondrement

const cle = process.env.GSC_CLE_JSON;
if (!cle) {
  console.log('Sentinelle de trafic — en attente d\'autorisation\n');
  console.log('   Search Console n\'est pas encore connectée : le secret GSC_CLE_JSON');
  console.log('   est absent. La marche à suivre est en tête de ce fichier.\n');
  console.log('   Tant qu\'elle n\'est pas branchée, une sanction Google resterait');
  console.log('   invisible pendant des mois. C\'est le seul garde-fou incomplet.\n');
  process.exit(0);
}

/* ── Jeton d'accès, signé localement ─────────────────────────────── */

async function jeton(compte) {
  const { createSign } = await import('node:crypto');
  const maintenant = Math.floor(Date.now() / 1000);
  const enTete = { alg: 'RS256', typ: 'JWT' };
  const charge = {
    iss: compte.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: maintenant + 3600,
    iat: maintenant,
  };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const aSigner = `${b64(enTete)}.${b64(charge)}`;
  const signature = createSign('RSA-SHA256').update(aSigner).sign(compte.private_key, 'base64url');

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${aSigner}.${signature}`,
    }),
  });
  const d = await r.json();
  if (!d.access_token) throw new Error(`jeton refusé : ${JSON.stringify(d).slice(0, 200)}`);
  return d.access_token;
}

/* ── Relevé ──────────────────────────────────────────────────────── */

const jour = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

/**
 * Quelle propriété interroger.
 *
 * Search Console distingue deux formes, et l'API refuse celle qu'on ne possède
 * pas : « sc-domain:asiaunseen.com » pour une propriété de domaine,
 * « https://asiaunseen.com/ » pour une propriété de préfixe d'URL. Ce script
 * fabriquait la seconde alors que le compte détient la première. Résultat :
 * six appels, six 403, et personne pour s'en apercevoir.
 *
 * On ne devine donc plus : on demande à Google la liste des propriétés
 * accessibles, et on prend celle qui correspond au domaine. Une propriété
 * ajoutée ou remplacée plus tard sera trouvée sans qu'on touche à ce fichier.
 */
async function proprieteDe(acces) {
  const r = await fetch('https://searchconsole.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${acces}` },
  });
  if (!r.ok) throw new Error(`liste des propriétés refusée (HTTP ${r.status}) : ${(await r.text()).slice(0, 200)}`);
  const sites = (await r.json()).siteEntry ?? [];

  const candidats = [`sc-domain:${DOMAINE}`, `https://${DOMAINE}/`, `http://${DOMAINE}/`];
  const trouve = candidats.find((c) => sites.some((s) => s.siteUrl === c));
  if (trouve) return trouve;

  throw new Error(
    `aucune propriété ne correspond à ${DOMAINE}. Le compte de service voit : ` +
    (sites.map((s) => s.siteUrl).join(', ') || '(aucune — il n\'a été ajouté à aucune propriété)'),
  );
}

/**
 * Un échec HTTP doit être bruyant.
 *
 * La version précédente lisait `d.rows?.[0]` sans regarder le code de retour.
 * Un 403 rendait donc zéro impression, en silence — et une sentinelle de
 * trafic qui lit zéro sans savoir pourquoi est pire qu'absente : elle rassure.
 * Zéro impression sur un site neuf est normal ; zéro impression parce que
 * l'appel a échoué ne l'est pas. Les deux ne doivent jamais se ressembler.
 */
async function releve(acces, propriete, debut, fin) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propriete)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: debut, endDate: fin, dimensions: [], rowLimit: 1 }),
    },
  );
  if (!r.ok) throw new Error(`relevé ${debut} → ${fin} refusé (HTTP ${r.status}) : ${(await r.text()).slice(0, 200)}`);
  const ligne = (await r.json()).rows?.[0];
  return { impressions: ligne?.impressions ?? 0, clics: ligne?.clicks ?? 0 };
}

/**
 * Quelles pages Google sert réellement, et sur quelles requêtes.
 *
 * Le relevé global dit « 431 impressions » sans dire d'où elles viennent. Or
 * la question qu'on se pose sur un site jeune n'est pas « combien », c'est
 * « lesquelles » : un site dont une seule page est vue et un site dont
 * quarante pages le sont ont le même total et deux avenirs différents.
 *
 * C'est aussi la seule façon honnête de répondre à « Google voit-il le
 * site ». Une recherche `site:` se heurte à un CAPTCHA, et un CAPTCHA ne se
 * contourne pas. Search Console, elle, répond.
 */
async function detail(acces, propriete, debut, fin, dimension, combien = 12) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propriete)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: debut, endDate: fin, dimensions: [dimension], rowLimit: combien }),
    },
  );
  if (!r.ok) return null; // le détail est un bonus : son échec ne doit rien casser
  return (await r.json()).rows ?? [];
}

const compte = JSON.parse(cle);
const acces = await jeton(compte);
const propriete = await proprieteDe(acces);

// Search Console publie ses données avec deux à trois jours de retard : on
// compare donc des fenêtres décalées, sinon la semaine en cours paraît
// toujours en chute.
const recente = await releve(acces, propriete, jour(10), jour(3));
const precedente = await releve(acces, propriete, jour(38), jour(11));

const moyennePrecedente = precedente.impressions / 4;
const chute = moyennePrecedente > 0 ? 1 - recente.impressions / moyennePrecedente : 0;

/* ── Mémoire, pour lire une tendance et pas un point ─────────────── */

/**
 * On relève une fois par semaine, pas une fois par jour.
 *
 * L'alerte, elle, ne dépend pas de ce fichier : elle interroge Search Console
 * sur deux fenêtres à chaque passage. L'historique sert à autre chose — lire
 * une tendance sur des mois, et donner au bilan mensuel de quoi montrer une
 * courbe plutôt qu'un point.
 *
 * Un relevé quotidien produirait un commit par nuit pour une information qui
 * bouge lentement. Une entrée hebdomadaire suffit, et deux ans tiennent en
 * cent quatre lignes.
 */
const historique = existsSync(ETAT) ? JSON.parse(readFileSync(ETAT, 'utf8')) : [];
const dernier = historique.at(-1);
const joursDepuis = dernier ? (Date.now() - new Date(dernier.date)) / 86_400_000 : Infinity;

if (joursDepuis >= 6) {
  historique.push({ date: jour(0), impressions: recente.impressions, clics: recente.clics });
  writeFileSync(ETAT, JSON.stringify(historique.slice(-104), null, 2) + '\n');
}

/* ── Rapport ────────────────────────────────────────────────────── */

console.log('Sentinelle de trafic\n');
console.log(`   impressions, 7 derniers jours      ${recente.impressions}`);
console.log(`   moyenne des 4 semaines d'avant     ${Math.round(moyennePrecedente)}`);
console.log(`   clics, 7 derniers jours            ${recente.clics}\n`);

/**
 * Le détail, avant tout verdict.
 *
 * Il répond à la question qu'on se pose vraiment sur un site jeune — Google
 * voit-il ce site, et quoi exactement — là où le total ne répond qu'à
 * « combien ». Il s'affiche même quand il n'y a rien à signaler, parce que
 * c'est là qu'il sert.
 */
{
  const pages = await detail(acces, propriete, jour(10), jour(3), 'page');
  const requetes = await detail(acces, propriete, jour(10), jour(3), 'query', 10);

  if (pages?.length) {
    console.log(`   ${pages.length} page(s) servies par Google sur la période :\n`);
    for (const p of pages) {
      const url = p.keys[0].replace(/^https?:\/\/[^/]+/, '') || '/';
      console.log(
        `     ${String(p.impressions).padStart(5)} impr.  ${String(p.clicks).padStart(3)} clic(s)  ` +
        `pos. ${p.position.toFixed(1).padStart(5)}   ${url}`,
      );
    }
    console.log();
  } else if (pages) {
    console.log('   Aucune page servie sur la période : Google connaît le site mais ne');
    console.log('   le propose encore sur aucune recherche.\n');
  }

  if (requetes?.length) {
    console.log('   Les recherches qui vous font apparaître :\n');
    for (const q of requetes) {
      console.log(
        `     ${String(q.impressions).padStart(5)} impr.  pos. ${q.position.toFixed(1).padStart(5)}   ${q.keys[0]}`,
      );
    }
    console.log();
  }
}

// Un site neuf n'a presque pas d'impressions : parler de chute n'aurait alors
// aucun sens, et une fausse alerte apprend à ignorer les vraies.
if (moyennePrecedente < 50) {
  console.log('   Trop peu de données pour conclure. Le site est jeune : c\'est normal,');
  console.log('   et la surveillance devient utile quand le trafic décolle.\n');
  process.exit(0);
}

if (chute >= CHUTE_GRAVE) {
  console.log(`⛔ Les impressions ont chuté de ${Math.round(chute * 100)} %.\n`);
  console.log('   COUPEZ LA RÉDACTION AUTOMATIQUE MAINTENANT : passez `active` à false');
  console.log('   dans src/data/redaction.ts. On enquête ensuite, pas avant.\n');
  console.log('   Une chute de cette ampleur sans panne du site est le signe d\'une');
  console.log('   action de Google. Vérifiez les actions manuelles dans Search Console.\n');
  process.exit(1);
}

if (chute >= CHUTE_ALERTE) {
  console.log(`⚠  Les impressions ont baissé de ${Math.round(chute * 100)} %.\n`);
  console.log('   Ce n\'est pas encore un effondrement, mais c\'est trop pour de la');
  console.log('   saisonnalité. Regardez Search Console avant la prochaine publication.\n');
  process.exit(2);
}

console.log('✓ Rien d\'anormal dans l\'évolution du trafic.\n');
