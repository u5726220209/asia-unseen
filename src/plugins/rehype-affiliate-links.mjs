import { visit } from 'unist-util-visit';

/**
 * Traite automatiquement les liens sortants des fichiers Markdown.
 *
 *  · Lien vers un domaine partenaire  → rel="sponsored nofollow noopener",
 *    ouverture dans un nouvel onglet, ajout de l'identifiant d'affiliation
 *    et marquage data-aff (repris par le suivi de clics de BaseLayout).
 *  · Autre lien externe               → rel="noopener noreferrer", nouvel onglet.
 *
 * L'auteur écrit donc du Markdown normal : `[Booking](https://www.booking.com/…)`.
 * Le tracking et les attributs obligatoires sont ajoutés à la compilation,
 * ce qui évite les oublis — et les oublis, ici, sont soit une perte de revenu,
 * soit un manquement aux règles de Google sur les liens sponsorisés.
 */

/** hôte → [clé partenaire, paramètre de tracking] */
const PARTNER_HOSTS = {
  'booking.com': ['booking', 'aid'],
  'agoda.com': ['agoda', 'cid'],
  '12go.asia': ['twelvego', 'z'],
  'getyourguide.fr': ['getyourguide', 'partner_id'],
  'getyourguide.com': ['getyourguide', 'partner_id'],
  'klook.com': ['klook', null],
  'airalo.com': ['airalo', 'ref'],
  'holafly.com': ['holafly', 'ref'],
  'chapkadirect.fr': ['chapka', 'ag'],
  'avi-international.com': ['avi', null],
  'wise.com': ['wise', null],
  'revolut.com': ['revolut', null],
  'skyscanner.fr': ['skyscanner', null],
};


function matchPartner(hostname) {
  const clean = hostname.replace(/^www\./, '');
  for (const host of Object.keys(PARTNER_HOSTS)) {
    if (clean === host || clean.endsWith('.' + host)) return PARTNER_HOSTS[host];
  }
  return null;
}

export function rehypeAffiliateLinks(ids = {}) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href;
      if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;

      let url;
      try { url = new URL(href); } catch { return; }

      const partner = matchPartner(url.hostname);
      if (partner) {
        const [key, param] = partner;
        const id = ids[key];
        if (param && id) url.searchParams.set(param, id);
        node.properties.href = url.toString();
        node.properties.rel = 'sponsored nofollow noopener';
        node.properties.target = '_blank';
        node.properties['data-aff'] = key;
      } else {
        node.properties.rel = 'noopener noreferrer';
        node.properties.target = '_blank';
      }
    });
  };
}
