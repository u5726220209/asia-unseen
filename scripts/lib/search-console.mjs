/**
 * L'accès à Search Console, écrit une seule fois.
 *
 * La sentinelle de trafic portait cette mécanique — signature du jeton,
 * découverte de la propriété, interrogation — et un second outil en avait
 * besoin. La recopier garantissait qu'ils divergeraient : un correctif appliqué
 * ici, oublié là, et deux réponses différentes à la même question. Ce dépôt a
 * déjà payé ce prix sur la description des fiches pays.
 *
 * Deux pièges sont enfermés ici, tous deux déjà rencontrés :
 *
 *   — La propriété ne se devine pas. Search Console distingue
 *     « sc-domain:exemple.com » d'une propriété de préfixe d'URL, et refuse
 *     celle qu'on ne possède pas. On demande donc la liste plutôt que de
 *     fabriquer un identifiant.
 *
 *   — Un échec HTTP doit être bruyant. Lire les lignes sans regarder le code
 *     de retour transforme un 403 en « zéro impression », c'est-à-dire en
 *     bonne nouvelle silencieuse.
 */

const API = 'https://searchconsole.googleapis.com/webmasters/v3';

/** Un jeton d'accès à partir de la clé JSON d'un compte de service. */
export async function jeton(compte) {
  const { createSign } = await import('node:crypto');
  const maintenant = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const aSigner =
    `${b64({ alg: 'RS256', typ: 'JWT' })}.` +
    b64({
      iss: compte.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: maintenant + 3600,
      iat: maintenant,
    });
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

/** La propriété que le compte détient réellement pour ce domaine. */
export async function proprieteDe(acces, domaine) {
  const r = await fetch(`${API}/sites`, { headers: { Authorization: `Bearer ${acces}` } });
  if (!r.ok) throw new Error(`liste des propriétés refusée (HTTP ${r.status})`);
  const sites = (await r.json()).siteEntry ?? [];
  const trouve = sites.find(
    (s) => s.siteUrl === `sc-domain:${domaine}` || s.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') === domaine,
  );
  if (trouve) return trouve.siteUrl;
  throw new Error(
    `aucune propriété ne correspond à ${domaine}. Le compte de service voit : ` +
      (sites.map((s) => s.siteUrl).join(', ') || "(aucune — il n'a été ajouté à aucune propriété)"),
  );
}

/** Une interrogation de l'analyse de recherche, avec les dimensions demandées. */
export async function interroger(acces, propriete, { debut, fin, dimensions = [], lignes = 1 }) {
  const r = await fetch(`${API}/sites/${encodeURIComponent(propriete)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${acces}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: debut, endDate: fin, dimensions, rowLimit: lignes }),
  });
  if (!r.ok) {
    throw new Error(`relevé ${debut} → ${fin} refusé (HTTP ${r.status}) : ${(await r.text()).slice(0, 200)}`);
  }
  return (await r.json()).rows ?? [];
}

/** Le jour d'il y a n jours, au format que l'API attend. */
export const jour = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
