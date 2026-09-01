#!/usr/bin/env node
/**
 * Le gardien.
 *
 * Il ne regarde pas le code : il regarde le site tel qu'il est servi, depuis
 * l'extérieur. Trois accidents coûteraient très cher et ne se verraient pas :
 *
 *   · un `noindex` posé par mégarde — le site sort de Google en quelques jours,
 *     et on s'en aperçoit des semaines plus tard, quand le trafic a disparu ;
 *   · `ads.txt` qui saute d'un déploiement — les revenus publicitaires
 *     s'arrêtent sans notification ;
 *   · l'hébergeur qui tombe un dimanche soir.
 *
 * Aucun de ces trois ne fait de bruit. C'est précisément pour ça qu'ils
 * méritent une surveillance à part, sur la production et non sur le dépôt.
 */

const SITE = process.env.SITE_URL || 'https://asiaunseen.com';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/** Les pages dont l'indisponibilité est une urgence. */
const PAGES_VITALES = [
  '/', '/vietnam', '/thailande', '/visas-asie', '/budget-voyage-asie',
  '/blog', '/comparer-visas', '/mentions-legales',
];

/** Les fichiers qui ne doivent jamais disparaître d'un déploiement. */
const FICHIERS_VITAUX = [
  { chemin: '/ads.txt', doitContenir: 'pub-5044188066752064', pourquoi: 'sans lui, AdSense cesse de diffuser' },
  { chemin: '/robots.txt', doitContenir: 'Sitemap', pourquoi: 'il déclare le plan du site' },
  { chemin: '/sitemap-index.xml', doitContenir: '<sitemap', pourquoi: 'Google y lit la liste des pages' },
  { chemin: '/donnees/visas.json', doitContenir: '"nombrePays"', pourquoi: 'jeu de données public' },
  { chemin: '/robots.txt', doitContenir: 'Sitemap', pourquoi: 'il déclare le plan du site' },
];

/** Les seules pages autorisées à porter un noindex. */
const NOINDEX_LEGITIMES = ['/404'];

const alertes = [];
const ok = [];

async function chercher(chemin) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25_000);
  try {
    const r = await fetch(SITE + chemin, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctrl.signal });
    const texte = await r.text();
    return { statut: r.status, texte };
  } catch (e) {
    return { statut: 0, erreur: String(e.cause?.code ?? e.message).slice(0, 40) };
  } finally {
    clearTimeout(t);
  }
}

/* ── 1. Les pages vitales répondent ─────────────────────────────── */

for (const p of PAGES_VITALES) {
  const r = await chercher(p);
  if (r.statut !== 200) {
    alertes.push({ gravite: 'critique', quoi: `${p} répond ${r.statut || r.erreur}`, pourquoi: 'page indisponible pour les visiteurs et pour Google' });
    continue;
  }
  // 2. Aucun noindex inattendu.
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(r.texte) && !NOINDEX_LEGITIMES.includes(p)) {
    alertes.push({ gravite: 'critique', quoi: `${p} porte un noindex`, pourquoi: 'la page sortira de Google en quelques jours' });
  } else {
    ok.push(p);
  }
}

/* ── 3. Les fichiers vitaux sont servis et non vides ─────────────── */

for (const f of FICHIERS_VITAUX) {
  const r = await chercher(f.chemin);
  if (r.statut !== 200) {
    alertes.push({ gravite: 'critique', quoi: `${f.chemin} répond ${r.statut || r.erreur}`, pourquoi: f.pourquoi });
  } else if (!r.texte.includes(f.doitContenir)) {
    alertes.push({ gravite: 'critique', quoi: `${f.chemin} est servi mais son contenu a changé`, pourquoi: f.pourquoi });
  } else {
    ok.push(f.chemin);
  }
}

/* ── 4. Le certificat n'expire pas dans les quinze jours ─────────── */

let certificat = null;
try {
  const { execFileSync } = await import('node:child_process');
  const hote = new URL(SITE).hostname;
  const sortie = execFileSync(
    'bash',
    ['-c', `echo | openssl s_client -servername ${hote} -connect ${hote}:443 2>/dev/null | openssl x509 -noout -enddate`],
    { encoding: 'utf8', timeout: 20_000 },
  );
  const m = sortie.match(/notAfter=(.+)/);
  if (m) {
    const fin = new Date(m[1]);
    const jours = Math.round((fin - Date.now()) / 86_400_000);
    certificat = { expireLe: fin.toISOString().slice(0, 10), jours };
    if (jours < 15) {
      alertes.push({ gravite: 'critique', quoi: `le certificat expire dans ${jours} jours`, pourquoi: 'un certificat expiré rend le site inaccessible et effraie les visiteurs' });
    } else {
      ok.push(`certificat valide ${jours} jours`);
    }
  }
} catch { certificat = { erreur: 'non vérifiable depuis cette machine' }; }

/* ── 5. La version en ligne est-elle bien celle attendue ? ───────── */

/**
 * Le contrôle qui manquait. Un déploiement peut réussir sans rien changer :
 * c'est arrivé, le transfert partant dans un sous-dossier. Toutes les pages
 * répondaient, les quatorze contrôles passaient, et le site était figé.
 *
 * On compare donc la signature servie à celle attendue. Appelé avec
 * --attendu <sha>, le gardien exige l'égalité — c'est ce que fait la mise en
 * ligne juste après un transfert. Sans argument, il se contente de dire quelle
 * version est en ligne et depuis quand.
 */
/*
  `indexOf` rend -1 quand l'option est absente, et argv[0] est alors le chemin
  de l'exécutable Node. Le gardien comparait donc la version du site à
  « /usr/local/bin/node » et ouvrait une alerte critique toutes les six heures.

  Une alerte fausse et récurrente est le pire état possible pour une
  surveillance : elle apprend à ignorer le messager, et le jour où le signal
  est vrai, personne ne le lit. D'où la vérification explicite de la présence
  de l'option.
*/
const iAttendu = process.argv.indexOf('--attendu');
const attendu = iAttendu >= 0 ? process.argv[iAttendu + 1] : null;
const versionEnLigne = await chercher('/version.txt');
let version = null;

if (versionEnLigne.statut !== 200) {
  if (attendu) alertes.push({ gravite: 'critique', quoi: '/version.txt est absent du site', pourquoi: 'impossible de vérifier que le déploiement a bien remplacé les fichiers' });
} else {
  const [sha, date] = versionEnLigne.texte.trim().split('\n');
  const heures = Math.round((Date.now() - new Date(date)) / 3_600_000);
  version = { sha, date, heures };

  if (attendu && sha !== attendu.trim()) {
    alertes.push({
      gravite: 'critique',
      quoi: `le site en ligne est en version ${sha}, alors que ${attendu.trim()} vient d'être déployée`,
      pourquoi: 'le transfert a réussi sans remplacer les fichiers servis — vérifiez server-dir',
    });
  } else {
    ok.push(`version ${sha}, publiée il y a ${heures} h`);
  }
}

/* ── 6. Le bandeau de consentement est toujours là ───────────────── */

const accueil = await chercher('/');
if (accueil.statut === 200) {
  if (!accueil.texte.includes('fundingchoicesmessages.google.com') && !accueil.texte.includes('adsbygoogle')) {
    alertes.push({ gravite: 'sérieuse', quoi: 'le dispositif de consentement Google est absent de l\'accueil', pourquoi: 'sans CMP certifiée, aucune annonce ne peut être servie en Europe' });
  } else {
    ok.push('consentement Google présent');
  }
}

/* ── Rapport ────────────────────────────────────────────────────── */

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ site: SITE, date: new Date().toISOString(), controles: ok.length + alertes.length, alertes, certificat, version }, null, 2));
} else {
  console.log(`Gardien — ${SITE}\n`);
  if (!alertes.length) {
    console.log(`✓ ${ok.length} contrôles passés. Rien à signaler.`);
    if (version) console.log(`  Version en ligne : ${version.sha}, publiée il y a ${version.heures} h.`);
    if (certificat?.jours) console.log(`  Certificat valide encore ${certificat.jours} jours.`);
  } else {
    console.log(`⛔ ${alertes.length} alerte(s) :\n`);
    for (const a of alertes) {
      console.log(`   [${a.gravite}] ${a.quoi}`);
      console.log(`              ${a.pourquoi}\n`);
    }
    console.log(`   ${ok.length} autres contrôles sont passés.`);
  }
  console.log();
}

process.exit(alertes.length ? 1 : 0);
