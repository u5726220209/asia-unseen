/**
 * Registre des partenaires d'affiliation.
 *
 * `buildUrl` produit systématiquement une URL trackée ; si l'identifiant
 * partenaire n'est pas renseigné, le lien reste fonctionnel (il pointe vers
 * le partenaire, sans tracking) — le site ne casse jamais.
 *
 * Tous les liens sortants d'affiliation passent par <AffiliateLink>, qui
 * ajoute rel="sponsored nofollow noopener" et une mention de transparence.
 */

const env = import.meta.env;

export type PartnerKey =
  | 'booking' | 'agoda' | 'twelvego' | 'getyourguide' | 'klook'
  | 'airalo' | 'holafly' | 'chapka' | 'avi' | 'wise' | 'revolut' | 'skyscanner';

type Partner = {
  key: PartnerKey;
  label: string;
  category: 'hebergement' | 'transport' | 'activites' | 'connectivite' | 'assurance' | 'argent';
  base: string;
  /** Paramètre de tracking et sa valeur (issue du .env). */
  param?: string;
  id: string;
  /**
   * Gabarit de lien réseau, quand le partenaire ne se traque pas par un simple
   * paramètre. Booking.com, par exemple, ne prend plus d'inscription directe :
   * tout passe par CJ Affiliate, qui fournit un lien de redirection portant
   * l'identifiant de l'éditeur, avec l'URL de destination encodée dedans.
   * Le gabarit contient le marqueur {url} là où cette destination doit aller.
   */
  template?: string;
  /** Fourchette de commission observée — sert au tableau de bord interne. */
  commission: string;
  /**
   * L'adresse de base pour un lecteur anglophone, quand elle diffère.
   *
   * GetYourGuide a un domaine par langue, et les fiches anglaises envoyaient
   * vers `getyourguide.fr` avec une requête en anglais : « Cambodia » cherché
   * sur un site français. La page s'ouvre, les activités existent, et le
   * lecteur atterrit dans une interface qu'il ne lit pas — juste après avoir
   * lu neuf écrans qui lui parlaient dans sa langue.
   *
   * Absent, l'adresse est la même dans les deux langues : Booking, Agoda et
   * 12Go servent la langue du navigateur depuis la même adresse.
   */
  baseEn?: string;
};

export const partners: Record<PartnerKey, Partner> = {
  booking:      { key: 'booking',      label: 'Booking.com',   category: 'hebergement',   base: 'https://www.booking.com/searchresults.html', param: 'aid', id: env.PUBLIC_AFF_BOOKING ?? '', template: env.PUBLIC_AFF_BOOKING_TEMPLATE ?? '', commission: '4 % du montant, via CJ Affiliate' },
  agoda:        { key: 'agoda',        label: 'Agoda',         category: 'hebergement',   base: 'https://www.agoda.com/search',               param: 'cid', id: env.PUBLIC_AFF_AGODA ?? '',        commission: '4–7 % du montant' },
  twelvego:     { key: 'twelvego',     label: '12Go Asia',     category: 'transport',     base: 'https://12go.asia',                          param: 'z',   id: env.PUBLIC_AFF_12GO ?? '',         commission: '5–10 %' },
  skyscanner:   { key: 'skyscanner',   label: 'Skyscanner',    category: 'transport',     base: 'https://www.skyscanner.fr',                                id: '',                                 commission: 'CPC / CPA variable' },
  getyourguide: { key: 'getyourguide', label: 'GetYourGuide',  category: 'activites',     base: 'https://www.getyourguide.fr', baseEn: 'https://www.getyourguide.com', param: 'partner_id', id: env.PUBLIC_AFF_GETYOURGUIDE ?? '', commission: '8 %' },
  klook:        { key: 'klook',        label: 'Klook',         category: 'activites',     base: 'https://www.klook.com',                                    id: '',                                 commission: '2–5 %' },
  airalo:       { key: 'airalo',       label: 'Airalo',        category: 'connectivite',  base: 'https://www.airalo.com',                     param: 'ref', id: env.PUBLIC_AFF_AIRALO ?? '',       commission: '10–15 %' },
  holafly:      { key: 'holafly',      label: 'Holafly',       category: 'connectivite',  base: 'https://esim.holafly.com',                   param: 'ref', id: env.PUBLIC_AFF_HOLAFLY ?? '',      commission: '10–20 %' },
  chapka:       { key: 'chapka',       label: 'Chapka',        category: 'assurance',     base: 'https://www.chapkadirect.fr',                param: 'ag',  id: env.PUBLIC_AFF_CHAPKA ?? '',       commission: '15–25 %' },
  avi:          { key: 'avi',          label: 'AVI International', category: 'assurance', base: 'https://www.avi-international.com',                        id: '',                                 commission: '15–30 %' },
  wise:         { key: 'wise',         label: 'Wise',          category: 'argent',        base: 'https://wise.com/invite',                                  id: env.PUBLIC_AFF_WISE ?? '',         commission: 'prime fixe par client actif' },
  revolut:      { key: 'revolut',      label: 'Revolut',       category: 'argent',        base: 'https://www.revolut.com',                                  id: '',                                 commission: 'prime fixe par client actif' },
};

/**
 * Construit l'URL trackée d'un partenaire.
 *
 * `path` permet de viser une page de destination plutôt que l'accueil : un lien
 * vers la page d'accueil d'une plateforme oblige le visiteur à refaire sa
 * recherche, et convertit donc beaucoup moins bien qu'un lien qui arrive
 * directement sur les résultats du pays concerné.
 */
export function buildUrl(
  key: PartnerKey,
  extra: Record<string, string> = {},
  path?: string,
  langue: 'fr' | 'en' = 'fr',
): string {
  const p = partners[key];
  const url = new URL(langue === 'en' && p.baseEn ? p.baseEn : p.base);
  if (path) url.pathname = path;
  if (p.param && p.id) url.searchParams.set(p.param, p.id);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);

  // Un gabarit de réseau, s'il existe, enveloppe la destination : le visiteur
  // passe par le réseau, qui compte le clic puis le renvoie vers la page voulue.
  if (p.template) return p.template.replace('{url}', encodeURIComponent(url.toString()));

  return url.toString();
}
