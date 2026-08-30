/**
 * Registre des photographies.
 *
 * Une photo n'est publiée que si elle est déclarée ici. Le fichier seul ne
 * suffit pas : sans texte alternatif ni crédit, une image n'a rien à faire
 * en ligne — ni pour l'accessibilité, ni pour le référencement, ni pour le
 * respect de l'auteur.
 *
 * Le site fonctionne parfaitement avec ce tableau vide : chaque emplacement
 * retombe alors sur une illustration « Horizons ». Ajouter des photos est une
 * amélioration progressive, jamais un prérequis.
 *
 * Mode d'emploi complet : PHOTOS.md à la racine.
 */

export type Photo = {
  /** Chemin du fichier, relatif à src/photos/ — ex. « vietnam/hanoi-rue-matin.jpg ». */
  fichier: string;

  /**
   * Texte alternatif. Décrit ce que l'on voit, pas ce que l'on ressent :
   * « une marchande verse du bouillon dans un bol, rue Hang Bo à Hanoï »,
   * pas « l'authenticité du Vietnam ». Sans point final, 125 caractères max.
   */
  alt: string;

  /** Légende visible sous l'image. Optionnelle — n'en mettez que si elle apprend quelque chose. */
  legende?: string;

  /**
   * Crédit. Unsplash et Pexels ne l'imposent pas, mais un site qui affiche sa
   * transparence sur les liens partenaires ne va pas taire d'où viennent ses images.
   */
  credit?: {
    auteur: string;
    source: 'Unsplash' | 'Pexels' | 'Personnel' | string;
    url?: string;
  };

  /** Pages où la photo s'affiche — chemins exacts, ex. « /vietnam », « /blog/ha-giang-moto-4-jours ». */
  pages: string[];

  /** Emplacement : sous l'en-tête, ou en respiration au milieu de la page. */
  position: 'hero' | 'bande';
};

export const photos: Photo[] = [
  // Exemple de déclaration — décommentez et adaptez après avoir déposé le fichier.
  //
  // {
  //   fichier: 'vietnam/hanoi-vieux-quartier-matin.jpg',
  //   alt: "une marchande verse du bouillon dans un bol, sur un trottoir du vieux quartier de Hanoï au lever du jour",
  //   legende: "Le vieux quartier avant 7 h : la seule heure où l'on y marche vraiment.",
  //   credit: { auteur: 'Prénom Nom', source: 'Unsplash', url: 'https://unsplash.com/photos/xxxxx' },
  //   pages: ['/vietnam'],
  //   position: 'hero',
  // },
];

/** Photo déclarée pour une page et un emplacement donnés, s'il y en a une. */
export function photoPour(page: string, position: 'hero' | 'bande'): Photo | undefined {
  const cible = page.replace(/\/$/, '') || '/';
  return photos.find((p) => p.position === position && p.pages.some((x) => (x.replace(/\/$/, '') || '/') === cible));
}

/** Nombre de pages couvertes par au moins une photo — repris par le script de contrôle. */
export const pagesAvecPhoto = new Set(photos.flatMap((p) => p.pages)).size;
