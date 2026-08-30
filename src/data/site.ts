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
    role: 'Éditeur',
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

/**
 * Identité légale de l'éditeur.
 *
 * Source : répertoire SIRENE, via l'API publique recherche-entreprises.api.gouv.fr
 * (source primaire — les agrégateurs type Pappers en dérivent).
 * Relevé le 30 août 2026.
 *
 * Ces mentions sont obligatoires : article 6 III de la loi pour la confiance
 * dans l'économie numérique. Un site publié sans elles expose son éditeur.
 */
export const legal = {
  /** Nom de l'entrepreneur individuel — c'est lui, l'éditeur, pas l'enseigne. */
  editeur: 'Fabrice Roy',
  /** Nom commercial déclaré au répertoire SIRENE. */
  enseigne: 'Syllodi Service',
  statut: 'Entrepreneur individuel',
  siren: '991 954 017',
  siret: '991 954 017 00018',
  /** Registre national des entreprises — immatriculation unique depuis 2023. */
  immatriculation: 'Registre national des entreprises (RNE)',
  ape: { code: '73.11Z', libelle: 'Activités des agences de publicité' },
  creation: '3 septembre 2025',
  adresse: '60 rue François 1er, 75008 Paris, France',
  /**
   * À confirmer par l'éditeur. Une entreprise individuelle non employeuse créée
   * en 2025 relève très probablement de la franchise en base ; le numéro
   * intracommunautaire (FR 33 991954017) ne s'affiche qu'une fois assujetti.
   */
  tva: 'TVA non applicable, article 293 B du CGI',
  directeurPublication: 'Fabrice Roy',
  hebergeur: {
    nom: 'Hostinger International Ltd',
    adresse: '61 Lordou Vironos Street, 6023 Larnaca, Chypre',
    url: 'https://www.hostinger.fr',
  },
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
