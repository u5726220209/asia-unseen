/**
 * Configuration centrale du site.
 * Tout ce qui touche à l'identité, au tracking et à la monétisation vit ici.
 * Les identifiants sont lus depuis les variables d'environnement (.env) :
 * tant qu'une valeur est vide, le bloc correspondant n'est pas rendu du tout.
 */

const env = import.meta.env;

export const site = {
  name: 'Asia Unseen',
  domain: (env.PUBLIC_SITE_URL || 'https://asiaunseen.com').replace(/^https?:\/\//, ''),
  url: env.PUBLIC_SITE_URL || 'https://asiaunseen.com',
  locale: 'fr_FR',
  lang: 'fr',
  tagline: "L'Asie, sans filtre",
  baseline: "Guides pratiques, conseils de terrain et adresses confidentielles",
  description:
    "Guides de voyage en Asie écrits sur le terrain : visas, budgets, transports, hébergement et erreurs à éviter. Vietnam, Thaïlande, Japon, Chine, Laos, Cambodge, Corée du Sud, Indonésie, Philippines.",
  author: {
    name: 'Tri Hung',
    role: 'Fondateur — basé au Vietnam',
    email: 'bonjour@asiaunseen.com',
  },
  social: {
    instagram: 'https://instagram.com/asiaunseen',
    youtube: 'https://youtube.com/@asiaunseen',
    pinterest: 'https://pinterest.com/asiaunseen',
  },
  /** Date de dernière revue éditoriale globale (affichée dans le hero). */
  lastReview: '2026-08',
} as const;

/* ── Analytics ─────────────────────────────────────────────── */
export const analytics = {
  ga4: env.PUBLIC_GA4_ID ?? '',
};

/* ── Monétisation display ──────────────────────────────────── */
export const adsense = {
  client: env.PUBLIC_ADSENSE_CLIENT ?? '',
  slots: {
    inArticle: env.PUBLIC_ADSENSE_SLOT_IN_ARTICLE ?? '',
    inFeed: env.PUBLIC_ADSENSE_SLOT_IN_FEED ?? '',
    sidebar: env.PUBLIC_ADSENSE_SLOT_SIDEBAR ?? '',
  },
  get enabled() {
    return this.client.length > 0;
  },
};

/* ── Newsletter ────────────────────────────────────────────── */
export const newsletter = {
  endpoint: env.PUBLIC_NEWSLETTER_ENDPOINT ?? '',
  leadMagnet: '5 itinéraires Asie prêts à partir',
  promise: "Un email tous les 15 jours. Du concret, jamais de remplissage. Désabonnement en un clic.",
};
