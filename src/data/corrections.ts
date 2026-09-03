/**
 * Journal public des corrections.
 *
 * Ce site affirme que ses informations sont datées et vérifiables. Cette page
 * le prouve : chaque correction issue d'un audit de fraîcheur y est publiée,
 * avec ce qui était affirmé, ce que dit la source officielle, et la date.
 *
 * Alimenté à la main après chaque audit (voir .claude/skills/audit-fraicheur).
 * Ajoutez les nouvelles entrées en haut du tableau.
 */

export type Correction = {
  /** Date de la correction, au format AAAA-MM-JJ. */
  date: string;
  /** Page principale concernée, sans le domaine — ex. « /thailande ». */
  page: string;
  /** Libellé lisible de la page. */
  pageLabel: string;
  /** Gravité : `critique` remonte en tête et porte un traitement visuel distinct. */
  gravite: 'critique' | 'correction' | 'precision';
  /** Ce qui a changé, en une phrase qui commence par le fait. */
  titre: string;
  /** Ce que le site affirmait auparavant. */
  avant: string;
  /** Ce que dit la source officielle. */
  apres: string;
  source: { label: string; url: string };
  /**
   * Le prénom, ou le nom, de la personne qui a signalé le changement.
   *
   * Absent quand la correction vient de la veille automatique ou d'un audit
   * interne — ce qui est le cas de toutes les entrées d'ouverture. Il n'y a
   * donc rien à inventer ici : un crédit se gagne, il ne se fabrique pas, et
   * une page qui remercierait des gens qui n'ont rien fait serait la première
   * chose fausse de ce site.
   */
  signalePar?: string;
};

/** Les personnes qui ont signalé au moins une correction publiée. */
export function verificateurs(): string[] {
  return [...new Set(corrections.map((c) => c.signalePar).filter(Boolean) as string[])];
}

export const corrections: Correction[] = [
  {
    date: '2026-08-31',
    page: '/blog/ou-dormir-a-bangkok',
    pageLabel: 'Où dormir à Bangkok',
    gravite: 'precision',
    titre: "Le réseau à tarif unique compte huit lignes, pas treize",
    avant: "13 lignes, près de 200 stations.",
    apres:
      "Huit lignes et treize tracés, 194 stations, environ 277 kilomètres. La confusion venait du décompte des tracés, souvent présenté comme un nombre de lignes. Le point qui compte pour le voyageur est inchangé : ce tarif est réservé aux ressortissants thaïlandais.",
    source: {
      label: 'The Nation Thailand — mise en œuvre du tarif unique à 20 bahts',
      url: 'https://www.nationthailand.com/news/policy/40054115',
    },
  },
  {
    date: '2026-08-31',
    page: '/coree-du-sud',
    pageLabel: 'Corée du Sud',
    gravite: 'precision',
    titre: "Le K-ETA facultatif n'est pas gratuit, contrairement à ce qui était écrit",
    avant: "Coût : gratuit.",
    apres:
      "Gratuit parce que le K-ETA n'est pas exigé jusqu'au 31 décembre 2026 — mais le demander volontairement coûte 10 000 wons, non remboursables même en cas de refus. La mention « gratuit », sans cette nuance, laissait croire que la démarche facultative l'était aussi. La date de fin est par ailleurs celle fixée par un avis du 20 mars 2026, et non une échéance annuelle.",
    source: {
      label: 'K-ETA — portail officiel du ministère de la Justice coréen',
      url: 'https://www.k-eta.go.kr/portal/apply/index.do',
    },
  },
  {
    date: '2026-08-30',
    page: '/thailande',
    pageLabel: 'Thaïlande',
    gravite: 'critique',
    titre: "L'exemption de visa passe de 60 à 30 jours",
    avant: "Exemption jusqu'à 60 jours, prolongeable une fois sur place.",
    apres:
      "60 jours à ce jour, mais une réduction à 30 jours est annoncée comme imminente. Tout séjour planifié au-delà de 30 jours doit être reconfirmé avant le départ.",
    source: {
      label: 'France Diplomatie — Thaïlande, entrée et séjour',
      url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/thailande/conseils-aux-voyageurs-entree-sejour',
    },
  },
  {
    date: '2026-08-30',
    page: '/thailande',
    pageLabel: 'Thaïlande',
    gravite: 'correction',
    titre: "La carte d'arrivée numérique (TDAC) est obligatoire, pas facultative",
    avant: "Une déclaration d'arrivée en ligne peut être exigée : vérifiez avant de partir.",
    apres:
      "Obligatoire depuis le 1er mai 2025 pour toute entrée par air, terre ou mer, à remplir dans les 3 jours précédant l'arrivée.",
    source: {
      label: 'Thailand Digital Arrival Card — portail officiel',
      url: 'https://tdac.immigration.go.th/',
    },
  },
  {
    date: '2026-08-30',
    page: '/coree-du-sud',
    pageLabel: 'Corée du Sud',
    gravite: 'correction',
    titre: 'Le K-ETA est suspendu pour les Français jusqu\'au 31 décembre 2026',
    avant: "Le K-ETA peut être requise ou suspendue selon les périodes — coût annoncé à ≈ 10 000 KRW.",
    apres:
      "Exemption en vigueur du 1er janvier au 31 décembre 2026. Le K-ETA reste facultatif : le demander dispense de la carte d'arrivée. Coût ramené à zéro.",
    source: {
      label: 'Ambassade de la République de Corée en France',
      url: 'https://fra.mofa.go.kr/fr-fr/brd/m_9481/view.do?seq=758387',
    },
  },
  {
    date: '2026-08-30',
    page: '/chine',
    pageLabel: 'Chine',
    gravite: 'precision',
    titre: "L'exemption porte sur 30 jours et court jusqu'au 31 décembre 2026",
    avant: "Exemption de courte durée pour le tourisme — sans durée ni échéance.",
    apres:
      "30 jours, pour le tourisme, les affaires, les visites familiales, les échanges culturels et le transit. Passeports d'urgence exclus. Passeport valide 6 mois après la sortie. Enregistrement auprès de la police sous 24 h.",
    source: {
      label: 'France Diplomatie — Chine, entrée et séjour',
      url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/chine/conseils-aux-voyageurs-entree-sejour',
    },
  },
  {
    date: '2026-08-30',
    page: '/vietnam',
    pageLabel: 'Vietnam',
    gravite: 'precision',
    titre: "L'exemption est de 45 jours, et n'est pas prolongeable",
    avant: "Exemption sans visa pour les séjours courts — sans durée précisée.",
    apres:
      "45 jours sans visa. Ni l'exemption ni l'e-visa ne sont prolongeables sur place. Enregistrement en ligne 72 h avant l'arrivée à l'aéroport de Hô Chi Minh-Ville.",
    source: {
      label: 'France Diplomatie — Vietnam, entrée et séjour',
      url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/vietnam/conseils-aux-voyageurs-entree-sejour',
    },
  },
  {
    date: '2026-08-30',
    page: '/philippines',
    pageLabel: 'Philippines',
    gravite: 'precision',
    titre: 'La prolongation est chiffrée, et eTravel est obligatoire',
    avant: "Prolongeable sur place — sans durée ni coût. eTravel présentée comme une déclaration.",
    apres:
      "Prolongation de 29 jours (59 au total) pour ≈ 3 030 PHP. eTravel obligatoire : le QR code est réclamé par la compagnie et à l'arrivée.",
    source: {
      label: 'France Diplomatie — Philippines, entrée et séjour',
      url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/philippines/conseils-aux-voyageurs-entree-sejour',
    },
  },
  {
    date: '2026-08-30',
    page: '/indonesie',
    pageLabel: 'Indonésie',
    gravite: 'precision',
    titre: 'La taxe touristique de Bali est chiffrée',
    avant: "Une taxe touristique locale s'ajoute à l'entrée à Bali — sans montant.",
    apres:
      "150 000 IDR (≈ 7,50 €) par entrée. Formulaire douanier « All Indonesia » dans les 72 h. Un passeport abîmé entraîne un refus d'entrée.",
    source: {
      label: 'France Diplomatie — Indonésie, entrée et séjour',
      url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/indonesie/conseils-aux-voyageurs-entree-sejour',
    },
  },
  {
    date: '2026-08-30',
    page: '/laos',
    pageLabel: 'Laos',
    gravite: 'precision',
    titre: 'Tous les postes-frontières terrestres ne délivrent pas de visa',
    avant: "Visa à l'arrivée aux principaux postes frontières.",
    apres:
      "Les points de passage terrestres délivrant un visa à l'arrivée ou acceptant l'e-visa sont limités : vérifiez le vôtre avant de vous y présenter. L'absence de tampon d'entrée est sanctionnée d'au moins 200 USD.",
    source: {
      label: 'France Diplomatie — Laos, entrée et séjour',
      url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/laos/conseils-aux-voyageurs-entree-sejour',
    },
  },
  {
    date: '2026-08-30',
    page: '/cambodge',
    pageLabel: 'Cambodge',
    gravite: 'correction',
    titre: "L'application « Cambodia e-arrival » est obligatoire par voie aérienne",
    avant: "Aucune mention d'un formulaire d'arrivée.",
    apres:
      "Obligatoire depuis le 1er septembre 2024 pour toute arrivée par avion. Une assurance couvrant hospitalisation et rapatriement est par ailleurs exigée.",
    source: {
      label: 'France Diplomatie — Cambodge, entrée et séjour',
      url: 'https://www.diplomatie.gouv.fr/fr/information-par-pays/cambodge/conseils-aux-voyageurs-entree-sejour',
    },
  },
];

/** Nombre total de corrections publiées — repris comme preuve sociale sur l'accueil. */
export const nbCorrections = corrections.length;

/** Date du dernier audit, dérivée du journal. */
export const dernierAudit = corrections
  .map((c) => c.date)
  .sort()
  .at(-1)!;

/** Corrections concernant une page donnée, les plus récentes d'abord. */
/**
 * L'ancre stable d'une correction, pour pouvoir la citer.
 *
 * Une correction est une unité d'information complète — un fait, une date, une
 * source, un avant et un après — mais courte. Lui donner une page à elle seule
 * produirait onze pages de trois cents mots, c'est-à-dire exactement ce que
 * Google appelle du contenu mince, sur un site dont la crédibilité est le seul
 * actif. Une ancre stable donne la même chose qu'une URL — un lien qu'on peut
 * envoyer, citer, ouvrir — sans le risque.
 *
 * Elle est construite sur la date et la page, jamais sur le titre : un titre se
 * reformule, et un lien envoyé la semaine dernière doit continuer de marcher.
 */
export function ancre(c: Correction): string {
  return `c-${c.date}-${c.page.replace(/^\//, '').replace(/\//g, '-') || 'accueil'}`;
}

/** L'adresse complète et citable d'une correction. */
export function lienCorrection(c: Correction): string {
  return `/mises-a-jour#${ancre(c)}`;
}

export function correctionsPourPage(page: string): Correction[] {
  return corrections.filter((c) => c.page === page).sort((a, b) => b.date.localeCompare(a.date));
}
