/**
 * Réglages de la rédaction automatique.
 *
 * Ce site publie des articles rédigés par une machine, sans relecture humaine
 * avant mise en ligne. C'est un choix assumé de l'éditeur, pris en connaissance
 * de ses risques. Ce fichier est l'endroit unique où ce dispositif se pilote,
 * et surtout où il s'arrête.
 *
 * Tout ce qui suit existe parce que personne ne relit. Chaque réglage remplace
 * un jugement humain par une règle, et une règle ne vaut que si elle est
 * respectée sans exception — d'où le fait qu'elles bloquent au lieu d'avertir.
 */

export const redaction = {
  /**
   * L'interrupteur.
   *
   * Passez à `false` et plus aucun article ne sera écrit ni publié
   * automatiquement. Le reste du site continue de fonctionner normalement :
   * publication manuelle, contrôles, surveillance, mise en ligne.
   *
   * C'est la première chose à faire en cas de doute, avant même de comprendre
   * ce qui se passe. On enquête ensuite.
   */
  active: true,

  /**
   * Plafond hebdomadaire, strictement appliqué.
   *
   * Deux articles par semaine est un rythme de publication soutenu et crédible.
   * Au-delà, on entre dans ce que Google appelle la production de masse, dont
   * la sanction est la désindexation — c'est-à-dire la fin du site. Ce plafond
   * n'est donc pas une préférence éditoriale, c'est une protection.
   */
  parSemaine: 2,

  /**
   * Le chantier en cours.
   *
   * Un seul pays à la fois. Google ne classe pas des pages isolées, il classe
   * des sites qui font autorité sur un sujet : dix articles sur le Vietnam
   * valent mieux que dix articles sur dix pays.
   */
  chantier: {
    pays: 'vietnam',
    /** Nombre d'articles visés sur ce pays avant de passer au suivant. */
    objectif: 12,
  },

  /**
   * Ordre de passage des chantiers, une fois l'objectif atteint.
   * Le Vietnam d'abord parce qu'il a déjà le plus d'articles et les meilleures
   * données : on renforce une position, on n'en ouvre pas une nouvelle.
   */
  file: ['vietnam', 'japon', 'thailande', 'coree-du-sud', 'indonesie', 'philippines'],

  /**
   * Seuils de la seconde lecture et du contrôle de variance.
   * Voir scripts/variance.mjs pour ce que chacun mesure exactement.
   */
  seuils: {
    /** Sources officielles minimales par article. En dessous, on ne publie pas. */
    sourcesMinimales: 2,
    /** Similarité maximale de structure avec les articles précédents, de 0 à 1. */
    varianceMaximale: 0.72,
    /** Nombre d'articles récents comparés entre eux. */
    fenetre: 10,
  },
} as const;

/** Vrai si la rédaction automatique est autorisée à publier aujourd'hui. */
export const redactionActive = () => redaction.active;
