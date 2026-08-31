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
 * ── Mise en route, une seule fois ──
 * Il faut autoriser l'accès à Search Console :
 *   1. console.cloud.google.com → créer un projet → activer « Search Console API »
 *   2. créer un compte de service, télécharger sa clé JSON
 *   3. dans Search Console → Paramètres → Utilisateurs → ajouter l'adresse du
 *      compte de service en lecture
 *   4. déposer la clé dans les secrets du dépôt sous GSC_CLE_JSON
 * Sans cela, ce script le dit et s'arrête sans bloquer quoi que ce soit.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const SITE = process.env.SITE_URL || 'https://asiaunseen.com';
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

async function releve(acces, debut, fin) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE + '/')}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: debut, endDate: fin, dimensions: [], rowLimit: 1 }),
    },
  );
  const d = await r.json();
  const ligne = d.rows?.[0];
  return { impressions: ligne?.impressions ?? 0, clics: ligne?.clicks ?? 0 };
}

const compte = JSON.parse(cle);
const acces = await jeton(compte);

// Search Console publie ses données avec deux à trois jours de retard : on
// compare donc des fenêtres décalées, sinon la semaine en cours paraît
// toujours en chute.
const recente = await releve(acces, jour(10), jour(3));
const precedente = await releve(acces, jour(38), jour(11));

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
