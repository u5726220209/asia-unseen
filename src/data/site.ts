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
  // La promesse du site est la vérifiabilité, pas le vécu. Elle a l'avantage
  // d'être démontrable : chaque fait porte sa source et sa date de relevé.
  baseline: "Guides pratiques, faits vérifiés et sources datées",
  description:
    "Guides de voyage en Asie vérifiés aux sources officielles : visas, budgets, transports, hébergement et erreurs à éviter. Vietnam, Thaïlande, Japon, Chine, Laos, Cambodge, Corée du Sud, Indonésie, Philippines.",
  author: {
    name: 'Tri Hung',
    role: 'Éditeur',
    // Boîte de réception unique de l'éditeur. Elle est hébergée sur un autre
    // domaine que le site, ce qui est volontaire : asiaunseen.com n'a pas de
    // service de messagerie, et une adresse qui ne reçoit rien vaut moins
    // qu'une adresse d'apparence dépareillée. Celle-ci a des MX valides.
    email: 'contact@racinesvietnam.com',
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
  /*
   * Vérifié le 30 août 2026, deux sources publiques concordantes :
   *   — VIES (Commission européenne) répond isValid: false pour FR33991954017.
   *     Aucun numéro de TVA intracommunautaire actif n'est rattaché au SIREN.
   *   — Le registre national confirme une entreprise individuelle sans salarié,
   *     créée le 3 septembre 2025, toujours active.
   *
   * Le seuil à ne pas dépasser n'est pas 37 500 € pour la première année :
   * l'article 293 D du CGI ajuste les plafonds au prorata des jours d'activité
   * (BOFiP BOI-TVA-DECLA-40-10-10, § 290). Du 3 septembre au 31 décembre 2025,
   * cela fait 120 jours, soit un seuil ajusté de 37 500 × 120/365 = 12 329 €,
   * et un seuil majoré de 13 562 €. Pour 2026, année pleine, les seuils
   * reprennent leur valeur normale : 37 500 € et 41 250 €.
   *
   * Reste à confirmer par l'éditeur : le chiffre d'affaires encaissé entre le
   * 3 septembre et le 31 décembre 2025. S'il dépasse 12 329 €, cette ligne doit
   * devenir « FR33991954017 » et l'intitulé redevenir « TVA intracommunautaire ».
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
  // Gabarit du bloc In-Feed, généré par AdSense en même temps que le bloc.
  layoutInFeed: env.PUBLIC_ADSENSE_LAYOUT_IN_FEED ?? '',
  get enabled() {
    return this.client.length > 0;
  },
};

/* ── Newsletter ────────────────────────────────────────────── */
export const newsletter = {
  /**
   * Adresse à laquelle le formulaire envoie l'inscription.
   *
   * Vide, le formulaire reste inerte et le dit — plutôt que d'échouer en
   * silence et de laisser croire à l'inscrit qu'il est inscrit.
   */
  endpoint: env.PUBLIC_NEWSLETTER_ENDPOINT ?? '',

  /**
   * Nom du champ e-mail attendu par le prestataire.
   *
   * Chacun a le sien : Brevo attend `EMAIL`, Mailchimp `EMAIL` aussi,
   * Buttondown `email`. Le mettre en réglage plutôt qu'en dur évite de
   * réécrire trois formulaires le jour où l'on change de service — et surtout
   * évite le pire des cas : un formulaire qui poste sagement un champ que
   * personne ne lit, donc des inscriptions perdues sans le moindre message
   * d'erreur.
   */
  champEmail: env.PUBLIC_NEWSLETTER_CHAMP ?? 'EMAIL',
  leadMagnet: 'Les fiches de départ — une par pays d\'Asie',
  promise: "Un email tous les 15 jours. Du concret, jamais de remplissage. Désabonnement en un clic.",

  /**
   * Mention d'information, affichée sous chaque formulaire.
   *
   * Le RGPD exige que la personne soit informée **au moment où elle donne son
   * adresse**, pas seulement sur une page de politique qu'elle n'ouvrira
   * jamais. Un lien vers la page ne suffit pas à lui seul : il faut dire ici
   * ce qu'on collecte, pour quoi faire, et comment repartir.
   *
   * Trois phrases, parce qu'une mention que personne ne lit ne protège
   * personne — ni le lecteur, ni l'éditeur.
   */
  rgpd: {
    texte: "Votre adresse sert uniquement à vous envoyer les fiches et leurs mises à jour. Une confirmation vous sera demandée par email. Désabonnement en un clic, à tout moment.",
    lienTexte: 'Comment vos données sont traitées',
    lienUrl: '/confidentialite',
  },
};
